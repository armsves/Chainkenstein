const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  // Your deployed contract addresses
  const contracts = {
    dragonSwapManager: "0xCc8934e07Ed1b214076BFAA09C7404D6c60C5A2A",
    markets: [
      "0x7414aeD53499243F97F18695C541BbCC94aBb334",
      "0xC95e5c0AA3823bd5b17EFc7231a10d015Fbc552A",
      "0xadeEb4E4241Ee0Ac0B40Ca09e2a612ceD552A666"
    ]
  };
  
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  
  console.log("Verifying contracts on BaseScan...");
  console.log("Using API key:", process.env.BASESCAN_API_KEY ? "✅ Found" : "❌ Missing");
  
  // Verify DragonSwapManager
  try {
    console.log("\n1. Verifying DragonSwapManager...");
    await hre.run("verify:verify", {
      address: contracts.dragonSwapManager,
      constructorArguments: [deployer.address],
    });
    console.log("✅ DragonSwapManager verified!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ DragonSwapManager already verified!");
    } else {
      console.log("❌ DragonSwapManager verification failed:", error.message);
    }
  }
  
  // Verify Markets
  const marketQuestions = [
    "Will ETH reach $5000 by end of March 2025?",
    "Will Bitcoin reach $100,000 by end of April 2025?",
    "Will Base TVL exceed $10B by end of May 2025?"
  ];
  
  for (let i = 0; i < contracts.markets.length; i++) {
    try {
      console.log(`\n${i + 2}. Verifying Market ${i + 1}...`);
      
      // Get market details to construct exact constructor args
      const market = await hre.ethers.getContractAt("Market", contracts.markets[i]);
      const endTime = await market.endTime();
      
      await hre.run("verify:verify", {
        address: contracts.markets[i],
        constructorArguments: [
          marketQuestions[i],
          Number(endTime),
          usdcAddress,
          hre.ethers.encodeBytes32String(""),
          hre.ethers.ZeroAddress,
          contracts.dragonSwapManager,
          deployer.address
        ],
      });
      console.log(`✅ Market ${i + 1} verified!`);
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log(`✅ Market ${i + 1} already verified!`);
      } else {
        console.log(`❌ Market ${i + 1} verification failed:`, error.message);
      }
    }
  }
  
  console.log("\n===========================================");
  console.log("VERIFICATION COMPLETE");
  console.log("===========================================");
  console.log("View your contracts on BaseScan:");
  console.log(`DragonSwapManager: https://sepolia.basescan.org/address/${contracts.dragonSwapManager}`);
  contracts.markets.forEach((addr, i) => {
    console.log(`Market ${i + 1}: https://sepolia.basescan.org/address/${addr}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });