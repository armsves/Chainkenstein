// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ICivicGate {
    function check(bytes calldata proof, address user) external view returns (bool);
}

contract Market is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    enum Side { YES, NO }
    
    string public question;
    uint64 public endTime;
    address public payoutToken;
    bytes32 public civicRule;
    address public creator;
    address public civicGate;
    address public dragonSwapManager;
    
    bool public isResolved;
    Side public winner;
    
    mapping(address => mapping(Side => uint256)) public userShares;
    mapping(address => uint256) public userDeposits;
    
    uint256 public yesShares;
    uint256 public noShares;
    uint256 public totalLiquidity;
    
    event Joined(
        address indexed user,
        Side side,
        uint256 amount,
        uint256 shares,
        address viaChain
    );
    
    event Resolved(Side winner, uint256 timestamp);
    
    event Redeemed(
        address indexed user,
        uint256 amount,
        uint256 totalShares
    );
    
    modifier notExpired() {
        require(block.timestamp <= endTime, "Market expired");
        _;
    }
    
    modifier onlyAfterExpiry() {
        require(block.timestamp > endTime, "Market not expired");
        _;
    }
    
    modifier notResolved() {
        require(!isResolved, "Market resolved");
        _;
    }
    
    modifier onlyResolved() {
        require(isResolved, "Market not resolved");
        _;
    }
    
    modifier onlyCreatorOrManager() {
        require(
            msg.sender == creator || msg.sender == dragonSwapManager,
            "Not authorized"
        );
        _;
    }
    
    constructor(
        string memory _question,
        uint64 _endTime,
        address _payoutToken,
        bytes32 _civicRule,
        address _civicGate,
        address _dragonSwapManager,
        address _creator
    ) {
        require(_endTime > block.timestamp, "Invalid end time");
        require(_payoutToken != address(0), "Invalid payout token");
        require(_creator != address(0), "Invalid creator");
        require(_dragonSwapManager != address(0), "Invalid manager");
        
        question = _question;
        endTime = _endTime;
        payoutToken = _payoutToken;
        civicRule = _civicRule;
        civicGate = _civicGate;
        dragonSwapManager = _dragonSwapManager;
        creator = _creator;
    }
    
    function join(
        Side side,
        uint256 amount,
        bytes calldata civicProof
    ) external notExpired notResolved nonReentrant {
        _join(msg.sender, side, amount, civicProof, address(0));
    }
    
    function joinFromZeta(
        Side side,
        uint256 amount,
        address user,
        bytes calldata civicProof
    ) external notExpired notResolved onlyCreatorOrManager nonReentrant {
        _join(user, side, amount, civicProof, msg.sender);
    }
    
    function _join(
        address user,
        Side side,
        uint256 amount,
        bytes calldata civicProof,
        address viaChain
    ) internal {
        require(amount > 0, "Invalid amount");
        require(user != address(0), "Invalid user");
        
        // Check Civic gate if required
        if (civicRule != bytes32(0) && civicGate != address(0)) {
            require(
                ICivicGate(civicGate).check(civicProof, user),
                "Civic verification failed"
            );
        }
        
        // Transfer tokens from user (or via chain caller)
        address payer = viaChain != address(0) ? viaChain : user;
        IERC20(payoutToken).safeTransferFrom(payer, address(this), amount);
        
        // Calculate shares (simplified constant product for demo)
        uint256 shares = amount; // 1:1 for simplicity
        
        if (side == Side.YES) {
            yesShares += shares;
        } else {
            noShares += shares;
        }
        
        userShares[user][side] += shares;
        userDeposits[user] += amount;
        totalLiquidity += amount;
        
        emit Joined(user, side, amount, shares, viaChain);
    }
    
    function resolve(Side _winner) 
        external 
        onlyAfterExpiry 
        notResolved 
        onlyCreatorOrManager 
    {
        isResolved = true;
        winner = _winner;
        
        emit Resolved(_winner, block.timestamp);
    }
    
    function redeem() external onlyResolved nonReentrant {
        uint256 winningShares = userShares[msg.sender][winner];
        require(winningShares > 0, "No winning shares");
        
        uint256 totalWinningShares = winner == Side.YES ? yesShares : noShares;
        require(totalWinningShares > 0, "No winning shares exist");
        
        uint256 payout = (winningShares * totalLiquidity) / totalWinningShares;
        
        // Clear user shares before transfer to prevent reentrancy
        userShares[msg.sender][winner] = 0;
        
        // Transfer payout using the payout token
        IERC20(payoutToken).safeTransfer(msg.sender, payout);
        
        emit Redeemed(msg.sender, payout, winningShares);
    }
    
    // Emergency function to unwind liquidity for payouts via DragonSwapManager
    function unwindLiquidity(uint256 amount) 
        external 
        onlyResolved 
        returns (uint256 unwound) 
    {
        require(msg.sender == dragonSwapManager, "Only manager can unwind");
        require(amount <= totalLiquidity, "Insufficient liquidity");
        
        totalLiquidity -= amount;
        IERC20(payoutToken).safeTransfer(dragonSwapManager, amount);
        
        return amount;
    }
    
    function getOdds() external view returns (uint256 yesPrice, uint256 noPrice) {
        uint256 total = yesShares + noShares;
        if (total == 0) {
            return (50, 50); // 50/50 if no shares
        }
        
        yesPrice = (yesShares * 100) / total;
        noPrice = 100 - yesPrice;
    }
    
    function getUserPosition(address user) 
        external 
        view 
        returns (uint256 yes, uint256 no, uint256 deposited) 
    {
        return (
            userShares[user][Side.YES],
            userShares[user][Side.NO],
            userDeposits[user]
        );
    }
    
    function getMarketInfo() 
        external 
        view 
        returns (
            string memory _question,
            uint64 _endTime,
            address _payoutToken,
            bool _isResolved,
            Side _winner,
            uint256 _yesShares,
            uint256 _noShares,
            uint256 _totalLiquidity
        ) 
    {
        return (
            question,
            endTime,
            payoutToken,
            isResolved,
            winner,
            yesShares,
            noShares,
            totalLiquidity
        );
    }
    
    // Emergency withdrawal function for creator
    function emergencyWithdraw() external {
        require(msg.sender == creator, "Only creator");
        require(block.timestamp > endTime + 30 days, "Too early for emergency");
        
        uint256 balance = IERC20(payoutToken).balanceOf(address(this));
        if (balance > 0) {
            IERC20(payoutToken).safeTransfer(creator, balance);
        }
    }
}