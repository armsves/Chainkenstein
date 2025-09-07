const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying third market...");
  console.log("Deployer:", deployer.address);
  
  // Get current nonce to avoid conflicts
  const currentNonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
  console.log("Using nonce:", currentNonce);
  
  const dragonSwapManagerAddress = "0xCc8934e07Ed1b214076BFAA09C7404D6c60C5A2A";
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  
  // Get current timestamp
  const currentBlock = await ethers.provider.getBlock('latest');
  const currentTime = currentBlock.timestamp;
  
  const Market = await ethers.getContractFactory("Market");
  
  const marketData = {
    question: "Will Base TVL exceed $10B by end of May 2025?",
    endTime: currentTime + (90 * 24 * 60 * 60), // 90 days
  };
  
  try {
    console.log("Deploying market with question:", marketData.question);
    console.log("End time:", new Date(marketData.endTime * 1000).toISOString());
    
    const market = await Market.deploy(
      marketData.question,
      marketData.endTime,
      usdcAddress,
      ethers.encodeBytes32String(""),
      ethers.ZeroAddress,
      dragonSwapManagerAddress,
      deployer.address,
      {
        nonce: currentNonce
      }
    );
    
    await market.waitForDeployment();
    const marketAddress = await market.getAddress();
    console.log("✅ Market 3 deployed to:", marketAddress);
    
    // Register with DragonSwapManager
    const dragonSwapManager = await ethers.getContractAt("DragonSwapManager", dragonSwapManagerAddress);
    
    const nextNonce = currentNonce + 1;
    console.log("Registering market with nonce:", nextNonce);
    
    const tx = await dragonSwapManager.setPair(marketAddress, usdcAddress, usdcAddress, {
      nonce: nextNonce
    });
    await tx.wait();
    
    console.log("✅ Market 3 registered with DragonSwapManager");
    
    console.log("\n===========================================");
    console.log("THIRD MARKET DEPLOYED SUCCESSFULLY");
    console.log("===========================================");
    console.log("Market 3 address:", marketAddress);
    console.log("Question:", marketData.question);
    console.log("End time:", new Date(marketData.endTime * 1000).toISOString());
    
    // Update your verification script with this new address
    console.log("\nAdd this to your verify-all.js markets array:");
    console.log(`"${marketAddress}",`);
    
  } catch (error) {
    console.error("Error deploying third market:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });