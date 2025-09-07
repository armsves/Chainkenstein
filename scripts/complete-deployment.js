const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("Completing deployment...");
  console.log("Deployer:", deployer.address);
  
  // Your deployed contract addresses
  const dragonSwapManagerAddress = "0xCc8934e07Ed1b214076BFAA09C7404D6c60C5A2A";
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  
  const existingMarkets = [
    "0x7414aeD53499243F97F18695C541BbCC94aBb334",
    "0xC95e5c0AA3823bd5b17EFc7231a10d015Fbc552A"
  ];
  
  // Get current timestamp
  const currentBlock = await ethers.provider.getBlock('latest');
  const currentTime = currentBlock.timestamp;
  
  console.log("Current time:", currentTime);
  
  // Deploy the third market
  const Market = await ethers.getContractFactory("Market");
  const dragonSwapManager = await ethers.getContractAt("DragonSwapManager", dragonSwapManagerAddress);
  
  console.log("\nDeploying third market...");
  const marketData = {
    question: "Will Base TVL exceed $10B by end of May 2025?",
    endTime: currentTime + (90 * 24 * 60 * 60), // 90 days
  };
  
  try {
    const market = await Market.deploy(
      marketData.question,
      marketData.endTime,
      usdcAddress,
      ethers.encodeBytes32String(""),
      ethers.ZeroAddress,
      dragonSwapManagerAddress,
      deployer.address
    );
    
    await market.waitForDeployment();
    const marketAddress = await market.getAddress();
    console.log("Market 3 deployed to:", marketAddress);
    
    // Set up all markets in DragonSwapManager
    const allMarkets = [...existingMarkets, marketAddress];
    
    console.log("\nSetting up DragonSwapManager...");
    
    // Check if deployer is already authorized
    const isAuthorized = await dragonSwapManager.authorizedFactories(deployer.address);
    if (!isAuthorized) {
      await dragonSwapManager.setAuthorizedFactory(deployer.address, true);
      console.log("Deployer authorized as factory");
    } else {
      console.log("Deployer already authorized as factory");
    }
    
    // Register all markets
    for (let i = 0; i < allMarkets.length; i++) {
      const marketAddr = allMarkets[i];
      try {
        await dragonSwapManager.setPair(marketAddr, usdcAddress, usdcAddress);
        console.log(`Market ${i + 1} (${marketAddr}) registered`);
      } catch (error) {
        if (error.message.includes("Market already exists")) {
          console.log(`Market ${i + 1} already registered`);
        } else {
          console.error(`Error registering market ${i + 1}:`, error.message);
        }
      }
    }
    
    console.log("\n===========================================");
    console.log("DEPLOYMENT COMPLETE");
    console.log("===========================================");
    console.log("DragonSwapManager:", dragonSwapManagerAddress);
    console.log("USDC:", usdcAddress);
    console.log("Markets:");
    console.log("  1. ETH $5000 prediction:", existingMarkets[0]);
    console.log("  2. BTC $100k prediction:", existingMarkets[1]);
    console.log("  3. Base TVL prediction:", marketAddress);
    
    // Save final deployment info
    const fs = require('fs');
    const deploymentInfo = {
      network: network.name,
      chainId: Number(network.chainId),
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {
        dragonSwapManager: dragonSwapManagerAddress,
        usdc: usdcAddress,
        markets: [
          {
            address: existingMarkets[0],
            question: "Will ETH reach $5000 by end of March 2025?",
            endTime: currentTime + (30 * 24 * 60 * 60)
          },
          {
            address: existingMarkets[1],
            question: "Will Bitcoin reach $100,000 by end of April 2025?",
            endTime: currentTime + (60 * 24 * 60 * 60)
          },
          {
            address: marketAddress,
            question: marketData.question,
            endTime: marketData.endTime
          }
        ]
      }
    };
    
    const deploymentDir = 'deployments';
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir);
    }
    
    const filename = `${deploymentDir}/complete-84532-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\nDeployment info saved to ${filename}`);
    
  } catch (error) {
    console.error("Error completing deployment:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });