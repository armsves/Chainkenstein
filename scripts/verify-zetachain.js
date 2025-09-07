const hre = require("hardhat");

async function main() {
  console.log("Starting verification on ZetaChain Testnet...");
  
  // Check network
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  console.log("Network:", network.name);
  console.log("Chain ID:", chainId);
  
  if (chainId !== 7001) {
    throw new Error(`Wrong network! Expected ZetaChain Testnet (7001), got ${chainId}. Use --network zetaTestnet`);
  }
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  // Your deployed contract addresses on ZetaChain Testnet
  // Replace these with your actual deployed addresses
  const contracts = {
    dragonSwapManager: "0xA8036a0056fb919aa9069615f7741D2593544b8A",
    markets: [
        "0xf6c9f4A8e497677AC5e01DaF90e549605d5FFC5A", 
        "0x2b86c3b937a37Bc14c6556a59CF388180081BB95",
        "0xCc8934e07Ed1b214076BFAA09C7404D6c60C5A2A"
    ]
  };
  
  // ZetaChain USDC ZRC20 addresses
  const usdcAddress = "0xd0eFed75622e7AA4555EE44F296dA3744E3ceE19"; // USDC.BASESEPOLIA on ZetaChain
  
  console.log("Verifying on ZetaChain Blockscout...");
  
  // Verify DragonSwapManager
  try {
    console.log("\n1. Verifying DragonSwapManager...");
    console.log("Address:", contracts.dragonSwapManager);
    console.log("Constructor args:", [deployer.address]);
    
    await hre.run("verify:verify", {
      address: contracts.dragonSwapManager,
      constructorArguments: [deployer.address],
      network: "zetaTestnet"
    });
    console.log("✅ DragonSwapManager verified!");
  } catch (error) {
    if (error.message.includes("Already Verified") || error.message.includes("already verified")) {
      console.log("✅ DragonSwapManager already verified!");
    } else {
      console.log("❌ DragonSwapManager verification failed:", error.message);
      console.log("This might be expected on ZetaChain as verification is still experimental");
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
      console.log("Address:", contracts.markets[i]);
      
      // Get market details to construct exact constructor args
      const market = await hre.ethers.getContractAt("Market", contracts.markets[i]);
      const endTime = await market.endTime();
      const question = await market.question();
      
      console.log("Question:", question);
      console.log("End time:", Number(endTime));
      
      const constructorArgs = [
        question,
        Number(endTime),
        usdcAddress,
        hre.ethers.encodeBytes32String(""),
        hre.ethers.ZeroAddress,
        contracts.dragonSwapManager,
        deployer.address
      ];
      
      await hre.run("verify:verify", {
        address: contracts.markets[i],
        constructorArguments: constructorArgs,
        network: "zetaTestnet"
      });
      console.log(`✅ Market ${i + 1} verified!`);
    } catch (error) {
      if (error.message.includes("Already Verified") || error.message.includes("already verified")) {
        console.log(`✅ Market ${i + 1} already verified!`);
      } else {
        console.log(`❌ Market ${i + 1} verification failed:`, error.message);
        console.log("This might be expected on ZetaChain as verification is still experimental");
      }
    }
  }
  
  console.log("\n===========================================");
  console.log("VERIFICATION COMPLETE");
  console.log("===========================================");
  console.log("View your contracts on ZetaChain Blockscout:");
  console.log(`DragonSwapManager: https://zetachain-athens-3.blockscout.com/address/${contracts.dragonSwapManager}`);
  contracts.markets.forEach((addr, i) => {
    console.log(`Market ${i + 1}: https://zetachain-athens-3.blockscout.com/address/${addr}`);
  });
  
  console.log("\nNote: ZetaChain verification might be experimental.");
  console.log("If verification fails, your contracts are still deployed and functional.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Verification failed:", error);
    process.exit(1);
  });