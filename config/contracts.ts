export const CONTRACT_ADDRESSES = {
  BASE: {
    MARKET_FACTORY: '0x...', // To be deployed
    CIVIC_GATE: '0x...',     // To be deployed
    DRAGON_SWAP_MANAGER: '0xCc8934e07Ed1b214076BFAA09C7404D6c60C5A2A',
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base USDC
  },
  ZETACHAIN: {
    ZETA_CONNECTOR: '0x239e96c8f17C85c30100AC26F635Ea15f23E9c67',
  }
};

export const GOLEM_DB_CONFIG = {
  chainId: parseInt(process.env.CHAIN_ID || process.env.NEXT_PUBLIC_CHAIN_ID || "60138453033"),
  rpcUrl: process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "https://ethwarsaw.holesky.golemdb.io/rpc",
  wsUrl: process.env.WS_URL || process.env.NEXT_PUBLIC_WS_URL || "wss://ethwarsaw.holesky.golemdb.io/rpc/ws",
  privateKey: process.env.PRIVATE_KEY || process.env.NEXT_PUBLIC_PRIVATE_KEY,
};

export const CONTRACTS = {
  ZETACHAIN_TESTNET: {
    chainId: 7001,
    rpcUrl: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
    blockExplorer: 'https://zetachain-athens-3.blockscout.com',
    dragonSwapManager: '0xA8036a0056fb919aa9069615f7741D2593544b8A',
    markets: [
      '0xf6c9f4A8e497677AC5e01DaF90e549605d5FFC5A',
      '0x2b86c3b937a37Bc14c6556a59CF388180081BB95',
      '0xCc8934e07Ed1b214076BFAA09C7404D6c60C5A2A'
    ],
    usdc: '0xd0eFed75622e7AA4555EE44F296dA3744E3ceE19', // USDC.BASESEPOLIA on ZetaChain
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base USDC
  },
  BASE_SEPOLIA: {
    chainId: 84532,
    rpcUrl: 'https://base-sepolia.publicnode.com',
    blockExplorer: 'https://base-sepolia.blockscout.com',
    dragonSwapManager: '0xCc8934e07Ed1b214076BFAA09C7404D6c60C5A2A',
    markets: [
      '0x7414aeD53499243F97F18695C541BbCC94aBb334',
      '0xC95e5c0AA3823bd5b17EFc7231a10d015Fbc552A',
      '0xadeEb4E4241Ee0Ac0B40Ca09e2a612ceD552A666'
    ],    
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base USDC
  }
} as const;

export const MARKET_QUESTIONS = [
  "Will ETH reach $5000 by end of March 2025?",
  "Will Bitcoin reach $100,000 by end of April 2025?",
  "Will Base TVL exceed $10B by end of May 2025?"
] as const;