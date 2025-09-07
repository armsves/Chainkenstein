// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Market.sol";
import "./CivicGate.sol";
import "./DragonSwapManager.sol";

contract MarketFactory {
    address public civicGate;
    address public dragonSwapManager;
    address public owner;
    
    mapping(address => bool) public isMarket;
    address[] public markets;
    
    event MarketCreated(
        address indexed market,
        address indexed creator,
        string question,
        uint64 endTime,
        bytes32 civicRule,
        address payoutToken
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _civicGate, address _dragonSwapManager) {
        civicGate = _civicGate;
        dragonSwapManager = _dragonSwapManager;
        owner = msg.sender;
    }
    
    function createMarket(
        string calldata question,
        uint64 endTime,
        address payoutToken,
        bytes32 civicRule,
        uint256 initialLiquidity
    ) external returns (address) {
        require(endTime > block.timestamp, "Invalid end time");
        require(initialLiquidity > 0, "Invalid liquidity");
        
        // Deploy new market
        Market market = new Market(
            question,
            endTime,
            payoutToken,
            civicRule,
            civicGate,
            dragonSwapManager,
            msg.sender
        );
        
        address marketAddress = address(market);
        isMarket[marketAddress] = true;
        markets.push(marketAddress);
        
        // Set up DragonSwap pair if manager is available
        if (dragonSwapManager != address(0)) {
            IDragonSwapManager(dragonSwapManager).setPair(
                marketAddress,
                payoutToken,
                marketAddress // Market contract acts as share token
            );
        }
        
        emit MarketCreated(
            marketAddress,
            msg.sender,
            question,
            endTime,
            civicRule,
            payoutToken
        );
        
        return marketAddress;
    }
    
    function getMarketsCount() external view returns (uint256) {
        return markets.length;
    }
    
    function getMarkets(uint256 offset, uint256 limit) 
        external 
        view 
        returns (address[] memory) 
    {
        require(offset < markets.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > markets.length) {
            end = markets.length;
        }
        
        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = markets[i];
        }
        
        return result;
    }
}
