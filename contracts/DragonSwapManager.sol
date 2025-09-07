// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IWZETA.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";
import "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IDragonSwapManager {
    function setPair(address market, address tokenA, address tokenB) external; // called by factory

    function rebalance(address market) external; // keeper or cron

    function unwindForPayout(
        address market,
        uint256 needed
    ) external returns (uint256 got);
}

contract DragonSwapManager is IDragonSwapManager, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    SystemContract public systemContract;
    IGatewayZEVM public gateway;

    struct Market {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLiquidity;
        bool isActive;
        uint256 lastRebalanceTime;
        uint256 targetRatio; // ratio of tokenA to tokenB (in basis points, 5000 = 50%)
    }

    struct CrossChainRequest {
        address sender;
        address market;
        uint256 amount;
        uint256 chainId;
        bytes data;
    }

    mapping(address => Market) public markets;
    mapping(address => bool) public authorizedFactories;
    mapping(address => bool) public authorizedKeepers;
    mapping(bytes32 => CrossChainRequest) public pendingRequests;

    address[] public marketList;

    uint256 public constant REBALANCE_THRESHOLD = 500; // 5% deviation
    uint256 public constant REBALANCE_COOLDOWN = 1 hours;
    uint256 public constant BASIS_POINTS = 10000;

    event MarketCreated(address indexed market, address tokenA, address tokenB);
    event MarketRebalanced(
        address indexed market,
        uint256 newReserveA,
        uint256 newReserveB
    );
    event LiquidityUnwound(
        address indexed market,
        uint256 amount,
        uint256 received
    );
    event CrossChainSwapInitiated(
        address indexed market,
        uint256 amount,
        uint256 targetChain
    );
    event CrossChainSwapCompleted(bytes32 indexed requestId, uint256 amount);

    modifier onlyAuthorizedFactory() {
        require(authorizedFactories[msg.sender], "Unauthorized factory");
        _;
    }

    modifier onlyAuthorizedKeeper() {
        require(
            authorizedKeepers[msg.sender] || msg.sender == owner(),
            "Unauthorized keeper"
        );
        _;
    }

    modifier validMarket(address market) {
        require(markets[market].isActive, "Market not active");
        _;
    }

    // Add constructor to initialize Ownable with initial owner
    constructor(address initialOwner) Ownable(initialOwner) {
        // You can add initialization logic here if needed
    }

    function setPair(
        address market,
        address tokenA,
        address tokenB
    ) external override onlyAuthorizedFactory {
        require(
            market != address(0) &&
                tokenA != address(0) &&
                tokenB != address(0),
            "Invalid addresses"
        );
        require(!markets[market].isActive, "Market already exists");

        markets[market] = Market({
            tokenA: tokenA,
            tokenB: tokenB,
            reserveA: 0,
            reserveB: 0,
            totalLiquidity: 0,
            isActive: true,
            lastRebalanceTime: block.timestamp,
            targetRatio: 5000 // 50% by default
        });

        marketList.push(market);

        emit MarketCreated(market, tokenA, tokenB);
    }

    function rebalance(
        address market
    ) external override onlyAuthorizedKeeper validMarket(market) {
        Market storage marketData = markets[market];

        require(
            block.timestamp >=
                marketData.lastRebalanceTime + REBALANCE_COOLDOWN,
            "Rebalance cooldown not met"
        );

        require(_needsRebalancing(market), "Rebalancing not needed");

        // Calculate target reserves based on current total value
        uint256 totalValue = _calculateTotalValue(market);
        uint256 targetValueA = (totalValue * marketData.targetRatio) /
            BASIS_POINTS;
        uint256 targetValueB = totalValue - targetValueA;

        // Convert to token amounts (simplified - in real implementation would use price oracles)
        uint256 targetReserveA = targetValueA;
        uint256 targetReserveB = targetValueB;

        // Perform the rebalancing
        _executeRebalance(market, targetReserveA, targetReserveB);

        marketData.lastRebalanceTime = block.timestamp;

        emit MarketRebalanced(market, marketData.reserveA, marketData.reserveB);
    }

    function unwindForPayout(
        address market,
        uint256 needed
    ) external override validMarket(market) nonReentrant returns (uint256 got) {
        Market storage marketData = markets[market];

        // Calculate how much liquidity to unwind
        uint256 totalValue = _calculateTotalValue(market);
        require(totalValue >= needed, "Insufficient liquidity");

        uint256 unwindRatio = (needed * BASIS_POINTS) / totalValue;

        uint256 unwindA = (marketData.reserveA * unwindRatio) / BASIS_POINTS;
        uint256 unwindB = (marketData.reserveB * unwindRatio) / BASIS_POINTS;

        // Transfer tokens to requester
        if (unwindA > 0) {
            IERC20(marketData.tokenA).safeTransfer(msg.sender, unwindA);
        }
        if (unwindB > 0) {
            IERC20(marketData.tokenB).safeTransfer(msg.sender, unwindB);
        }

        // Update reserves
        marketData.reserveA -= unwindA;
        marketData.reserveB -= unwindB;

        got = unwindA + unwindB;

        emit LiquidityUnwound(market, needed, got);

        return got;
    }

    // Cross-chain functionality using ZetaChain Gateway
    function initiateCrossChainSwap(
        address market,
        uint256 amount,
        uint256 targetChain,
        address targetAddress,
        bytes calldata callData
    ) external validMarket(market) {
        Market storage marketData = markets[market];

        // Transfer tokens from user
        IERC20(marketData.tokenA).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );

        // Create cross-chain request
        bytes32 requestId = keccak256(
            abi.encodePacked(msg.sender, market, amount, block.timestamp)
        );
        pendingRequests[requestId] = CrossChainRequest({
            sender: msg.sender,
            market: market,
            amount: amount,
            chainId: targetChain,
            data: callData
        });

        // Use ZetaChain Gateway for cross-chain call
        gateway.call(
            abi.encodePacked(targetAddress), // receiver as bytes
            marketData.tokenA, // zrc20 token for fees
            callData, // message
            CallOptions({gasLimit: 500000, isArbitraryCall: true}),
            RevertOptions({
                revertAddress: msg.sender,
                callOnRevert: true,
                abortAddress: address(0),
                revertMessage: abi.encode("refund"),
                onRevertGasLimit: 500_000
            })
        );

        emit CrossChainSwapInitiated(market, amount, targetChain);
    }

    // Handle incoming cross-chain calls
    function handleCrossChainCall(
        address sender,
        uint256 sourceChain,
        bytes calldata data
    ) external {
        // Only allow calls from the gateway
        require(msg.sender == address(gateway), "Only gateway can call");

        // Decode the cross-chain message
        (address market, uint256 amount, bytes memory swapData) = abi.decode(
            data,
            (address, uint256, bytes)
        );

        require(markets[market].isActive, "Invalid market");

        // Process the cross-chain swap
        _processCrossChainSwap(sender, market, amount, sourceChain, swapData);
    }

    // Internal functions
    function _needsRebalancing(address market) internal view returns (bool) {
        Market storage marketData = markets[market];

        if (marketData.reserveA == 0 || marketData.reserveB == 0) {
            return false;
        }

        uint256 totalValue = _calculateTotalValue(market);
        uint256 currentRatioA = (marketData.reserveA * BASIS_POINTS) /
            totalValue;
        uint256 deviation = currentRatioA > marketData.targetRatio
            ? currentRatioA - marketData.targetRatio
            : marketData.targetRatio - currentRatioA;

        return deviation > REBALANCE_THRESHOLD;
    }

    function _calculateTotalValue(
        address market
    ) internal view returns (uint256) {
        Market storage marketData = markets[market];
        return marketData.reserveA + marketData.reserveB;
    }

    function _executeRebalance(
        address market,
        uint256 targetReserveA,
        uint256 targetReserveB
    ) internal {
        Market storage marketData = markets[market];

        if (targetReserveA > marketData.reserveA) {
            uint256 swapAmount = targetReserveA - marketData.reserveA;
            if (swapAmount <= marketData.reserveB) {
                marketData.reserveA += swapAmount;
                marketData.reserveB -= swapAmount;
            }
        } else if (targetReserveB > marketData.reserveB) {
            uint256 swapAmount = targetReserveB - marketData.reserveB;
            if (swapAmount <= marketData.reserveA) {
                marketData.reserveB += swapAmount;
                marketData.reserveA -= swapAmount;
            }
        }
    }

    function _processCrossChainSwap(
        address sender,
        address market,
        uint256 amount,
        uint256 sourceChain,
        bytes memory swapData
    ) internal {
        bytes32 requestId = keccak256(
            abi.encodePacked(sender, market, amount, block.timestamp)
        );

        // Update market reserves based on the swap
        Market storage marketData = markets[market];
        marketData.reserveA += amount;

        emit CrossChainSwapCompleted(requestId, amount);
    }

    // Admin functions
    function setAuthorizedFactory(
        address factory,
        bool authorized
    ) external onlyOwner {
        authorizedFactories[factory] = authorized;
    }

    function setAuthorizedKeeper(
        address keeper,
        bool authorized
    ) external onlyOwner {
        authorizedKeepers[keeper] = authorized;
    }

    function setMarketTargetRatio(
        address market,
        uint256 ratio
    ) external onlyOwner validMarket(market) {
        require(ratio <= BASIS_POINTS, "Invalid ratio");
        markets[market].targetRatio = ratio;
    }

    function addLiquidity(
        address market,
        uint256 amountA,
        uint256 amountB
    ) external validMarket(market) nonReentrant {
        Market storage marketData = markets[market];

        IERC20(marketData.tokenA).safeTransferFrom(
            msg.sender,
            address(this),
            amountA
        );
        IERC20(marketData.tokenB).safeTransferFrom(
            msg.sender,
            address(this),
            amountB
        );

        marketData.reserveA += amountA;
        marketData.reserveB += amountB;
        marketData.totalLiquidity += amountA + amountB;
    }

    function emergencyWithdraw(
        address market
    ) external onlyOwner validMarket(market) {
        Market storage marketData = markets[market];

        if (marketData.reserveA > 0) {
            IERC20(marketData.tokenA).safeTransfer(
                owner(),
                marketData.reserveA
            );
        }
        if (marketData.reserveB > 0) {
            IERC20(marketData.tokenB).safeTransfer(
                owner(),
                marketData.reserveB
            );
        }

        marketData.reserveA = 0;
        marketData.reserveB = 0;
        marketData.isActive = false;
    }

    // View functions
    function getMarketInfo(
        address market
    ) external view returns (Market memory) {
        return markets[market];
    }

    function getAllMarkets() external view returns (address[] memory) {
        return marketList;
    }

    function getMarketCount() external view returns (uint256) {
        return marketList.length;
    }
}
