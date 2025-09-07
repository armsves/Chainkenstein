const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Checking current deployment state...");
  console.log("Deployer:", deployer.address);
  
  // Check current nonce
  const currentNonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
  const pendingNonce = await ethers.provider.getTransactionCount(deployer.address, "pending");
  
  console.log("Current nonce:", currentNonce);
  console.log("Pending nonce:", pendingNonce);
  
  // Your deployed contracts
  const dragonSwapManagerAddress = "0xCc8934e07Ed1b214076BFAA09C7404D6c60C5A2A";
  const marketAddresses = [
    "0x7414aeD53499243F97F18695C541BbCC94aBb334",
    "0xC95e5c0AA3823bd5b17EFc7231a10d015Fbc552A"
  ];
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  
  console.log("\nChecking DragonSwapManager state...");
  const dragonSwapManager = await ethers.getContractAt("DragonSwapManager", dragonSwapManagerAddress);
  
  try {
    // Check if deployer is authorized
    const isAuthorized = await dragonSwapManager.authorizedFactories(deployer.address);
    console.log("Deployer authorized as factory:", isAuthorized);
    
    // Check market count
    const marketCount = await dragonSwapManager.getMarketCount();
    console.log("Markets registered:", marketCount.toString());
    
    const allMarkets = await dragonSwapManager.getAllMarkets();
    console.log("Registered market addresses:", allMarkets);
    
    // If not authorized, authorize first
    if (!isAuthorized) {
      console.log("\nAuthorizing deployer as factory...");
      const tx = await dragonSwapManager.setAuthorizedFactory(deployer.address, true, {
        nonce: currentNonce
      });
      await tx.wait();
      console.log("✅ Deployer authorized!");
    }
    
    // Check which markets need to be registered
    console.log("\nChecking market registrations...");
    for (let i = 0; i < marketAddresses.length; i++) {
      const marketAddr = marketAddresses[i];
      try {
        const marketInfo = await dragonSwapManager.getMarketInfo(marketAddr);
        if (marketInfo.isActive) {
          console.log(`✅ Market ${i + 1} (${marketAddr}) already registered`);
        } else {
          console.log(`❌ Market ${i + 1} (${marketAddr}) not registered`);
        }
      } catch (error) {
        console.log(`❌ Market ${i + 1} (${marketAddr}) not registered - will register`);
        
        // Register the market
        try {
          const newNonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
          console.log(`Registering market ${i + 1} with nonce ${newNonce}...`);
          
          const tx = await dragonSwapManager.setPair(marketAddr, usdcAddress, usdcAddress, {
            nonce: newNonce
          });
          await tx.wait();
          console.log(`✅ Market ${i + 1} registered successfully!`);
          
          // Wait a bit between transactions
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (regError) {
          if (regError.message.includes("Market already exists")) {
            console.log(`✅ Market ${i + 1} was already registered`);
          } else {
            console.error(`❌ Failed to register market ${i + 1}:`, regError.message);
          }
        }
      }
    }
    
    // Final state check
    console.log("\n===========================================");
    console.log("FINAL STATE CHECK");
    console.log("===========================================");
    
    const finalMarketCount = await dragonSwapManager.getMarketCount();
    const finalMarkets = await dragonSwapManager.getAllMarkets();
    const finalAuthorized = await dragonSwapManager.authorizedFactories(deployer.address);
    
    console.log("Final authorized status:", finalAuthorized);
    console.log("Final market count:", finalMarketCount.toString());
    console.log("Final registered markets:", finalMarkets);
    
    // Verify each market
    console.log("\nVerifying individual markets...");
    for (const addr of marketAddresses) {
      try {
        const market = await ethers.getContractAt("Market", addr);
        const question = await market.question();
        const endTime = await market.endTime();
        const isResolved = await market.isResolved();
        
        console.log(`Market ${addr}:`);
        console.log(`  Question: ${question}`);
        console.log(`  End time: ${new Date(Number(endTime) * 1000).toISOString()}`);
        console.log(`  Resolved: ${isResolved}`);
      } catch (error) {
        console.log(`❌ Error reading market ${addr}:`, error.message);
      }
    }
    
    console.log("\n===========================================");
    console.log("DEPLOYMENT STATUS");
    console.log("===========================================");
    console.log("✅ DragonSwapManager:", dragonSwapManagerAddress);
    console.log("✅ Market 1 (ETH):", marketAddresses[0]);
    console.log("✅ Market 2 (BTC):", marketAddresses[1]);
    console.log("✅ USDC Token:", usdcAddress);
    
  } catch (error) {
    console.error("Error checking state:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });