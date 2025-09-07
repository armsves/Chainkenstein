const { ethers } = require("hardhat");

async function main() {
  // Check if we have signers
  const signers = await ethers.getSigners();
  
  if (signers.length === 0) {
    throw new Error("No signers found. Please check your PRIVATE_KEY in .env file");
  }
  
  const [deployer] = signers;
  
  if (!deployer || !deployer.address) {
    throw new Error("Deployer address is undefined. Please check your PRIVATE_KEY in .env file");
  }
  
  console.log("Deploying contracts with the account:", deployer.address);
  
  try {
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");
  } catch (error) {
    console.error("Error getting balance:", error.message);
  }

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);

  // Convert chainId to number for comparison
  const chainId = Number(network.chainId);
  console.log("Chain ID as number:", chainId);

  let systemContract, gateway, usdcToken;

  if (chainId === 7001) {
    // ZetaChain Testnet
    console.log("Deploying on ZetaChain Testnet...");
    
    systemContract = "0xEdf1c3275d13489aCdC6cD6eD246E72458B8795B";
    gateway = "0x6c533f7fe93fae114d0954697069df33c9b74fd7";
    
    // Use ZRC20 USDC tokens
    const usdcOptions = {
      baseSepolia: "0xd0eFed75622e7AA4555EE44F296dA3744E3ceE19", // USDC.BASESEPOLIA
      sepolia: "0xcC683A782f4B30c138787CB5576a86AF66fdc31d"     // USDC.SEPOLIA
    };
    
    // Default to Base Sepolia USDC for cross-chain compatibility
    usdcToken = usdcOptions.baseSepolia;
    console.log("Using USDC.BASESEPOLIA ZRC20:", usdcToken);
    
  } else if (chainId === 84532) {
    // Base Sepolia
    console.log("Deploying on Base Sepolia...");
    
    // For Base Sepolia, we'll use mock addresses for ZetaChain components
    systemContract = ethers.ZeroAddress;
    gateway = "0x0c487a766110c85d301d96e33579c5b317fa4995"; // Base Sepolia Gateway
    
    // Use native Base Sepolia USDC
    usdcToken = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    console.log("Using Base Sepolia USDC:", usdcToken);
    
  } else {
    throw new Error(`Unsupported network: ${chainId} (${network.name})`);
  }

  // Deploy DragonSwapManager
  console.log("Deploying DragonSwapManager...");
  console.log("Constructor arguments:");
  console.log("  initialOwner:", deployer.address);
  
  try {
    const DragonSwapManager = await ethers.getContractFactory("DragonSwapManager");
    
    const dragonSwapManager = await DragonSwapManager.deploy(
      deployer.address // initial owner (for Ownable)
    );
    
    console.log("Waiting for DragonSwapManager deployment...");
    await dragonSwapManager.waitForDeployment();
    const dragonSwapManagerAddress = await dragonSwapManager.getAddress();
    console.log("DragonSwapManager deployed to:", dragonSwapManagerAddress);

    // Get current block timestamp to ensure our end times are in the future
    const currentBlock = await ethers.provider.getBlock('latest');
    const currentTime = currentBlock.timestamp;
    console.log("Current block timestamp:", currentTime);
    console.log("Current date:", new Date(currentTime * 1000).toISOString());

    // Deploy sample markets with real-world questions
    const Market = await ethers.getContractFactory("Market");
    
    // Create end times that are definitely in the future
    const now = currentTime;
    const oneMonth = 30 * 24 * 60 * 60; // 30 days in seconds
    const twoMonths = 60 * 24 * 60 * 60; // 60 days in seconds
    const threeMonths = 90 * 24 * 60 * 60; // 90 days in seconds
    
    const markets = [
      {
        question: "Will ETH reach $5000 by end of March 2025?",
        endTime: now + oneMonth,
      },
      {
        question: "Will Bitcoin reach $100,000 by end of April 2025?",
        endTime: now + twoMonths,
      },
      {
        question: "Will Base TVL exceed $10B by end of May 2025?",
        endTime: now + threeMonths,
      }
    ];

    console.log("\nDeploying prediction markets...");
    const deployedMarkets = [];

    for (let i = 0; i < markets.length; i++) {
      const marketData = markets[i];
      console.log(`Deploying market ${i + 1}: ${marketData.question}`);
      console.log(`End time: ${marketData.endTime} (${new Date(marketData.endTime * 1000).toISOString()})`);
      
      try {
        const market = await Market.deploy(
          marketData.question,
          marketData.endTime,
          usdcToken, // Use USDC as payout token
          ethers.encodeBytes32String(""), // no civic rule for now
          ethers.ZeroAddress, // no civic gate for now
          dragonSwapManagerAddress,
          deployer.address
        );
        
        console.log(`Waiting for market ${i + 1} deployment...`);
        await market.waitForDeployment();
        const marketAddress = await market.getAddress();
        console.log(`Market ${i + 1} deployed to:`, marketAddress);
        
        deployedMarkets.push({
          address: marketAddress,
          question: marketData.question,
          endTime: marketData.endTime,
          endDate: new Date(marketData.endTime * 1000).toISOString()
        });
      } catch (error) {
        console.error(`Error deploying market ${i + 1}:`, error.message);
        console.error(`Attempted end time: ${marketData.endTime}`);
        console.error(`Current time: ${currentTime}`);
        console.error(`Difference: ${marketData.endTime - currentTime} seconds`);
        throw error;
      }
    }

    // Authorize deployer as factory in DragonSwapManager
    console.log("\nSetting up DragonSwapManager...");
    await dragonSwapManager.setAuthorizedFactory(deployer.address, true);
    console.log("Deployer authorized as factory");

    // Set up markets in DragonSwapManager with USDC pairs
    for (const market of deployedMarkets) {
      try {
        await dragonSwapManager.setPair(
          market.address,
          usdcToken,
          usdcToken // Using USDC for both sides of the market
        );
        console.log(`Market ${market.address} registered in DragonSwapManager`);
      } catch (error) {
        console.error(`Error registering market ${market.address}:`, error.message);
        // Continue with other markets
      }
    }

    console.log("\n===========================================");
    console.log("DEPLOYMENT SUCCESSFUL");
    console.log("===========================================");
    console.log("Network:", network.name, `(Chain ID: ${chainId})`);
    console.log("Deployer:", deployer.address);
    console.log("DragonSwapManager:", dragonSwapManagerAddress);
    console.log("USDC Token:", usdcToken);
    console.log("System Contract:", systemContract);
    console.log("Gateway:", gateway);
    
    console.log("\nDeployed Markets:");
    deployedMarkets.forEach((market, index) => {
      console.log(`  ${index + 1}. ${market.question}`);
      console.log(`     Address: ${market.address}`);
      console.log(`     End Date: ${market.endDate}`);
    });

    console.log("\n===========================================");
    console.log("FRONTEND CONFIGURATION");
    console.log("===========================================");
    
    const configOutput = `
// Contract addresses for ${network.name} (Chain ID: ${chainId})
export const CONTRACT_ADDRESSES = {
  ${chainId}: {
    dragonSwapManager: "${dragonSwapManagerAddress}",
    usdc: "${usdcToken}",
    systemContract: "${systemContract}",
    gateway: "${gateway}",
    markets: [
${deployedMarkets.map(m => `      {
        address: "${m.address}",
        question: "${m.question}",
        endTime: ${m.endTime},
        endDate: "${m.endDate}"
      },`).join('\n')}
    ]
  }
};

// USDC token configuration
export const USDC_CONFIG = {
  ${chainId}: {
    address: "${usdcToken}",
    symbol: "USDC",
    decimals: 6,
    ${chainId === 7001 ? 'type: "ZRC20",' : 'type: "ERC20",'}
  }
};
    `;
    
    console.log(configOutput);

    // Save deployment info
    const fs = require('fs');
    const deploymentInfo = {
      network: network.name,
      chainId: chainId,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {
        dragonSwapManager: dragonSwapManagerAddress,
        usdc: usdcToken,
        systemContract: systemContract,
        gateway: gateway,
        markets: deployedMarkets
      }
    };
    
    const deploymentDir = 'deployments';
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir);
    }
    
    const filename = `${deploymentDir}/${chainId}-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\nDeployment info saved to ${filename}`);

    console.log("\n===========================================");
    console.log("NEXT STEPS");
    console.log("===========================================");
    console.log("1. Update your frontend with the contract addresses above");
    console.log("2. Copy ABIs from artifacts/ to your frontend");
    console.log("3. Test market interactions with USDC");

  } catch (error) {
    console.error("Deployment failed:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });