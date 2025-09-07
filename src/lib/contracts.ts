import { Contract, ethers } from 'ethers';

// USDC token addresses on different networks
export const USDC_ADDRESSES = {
  // ZetaChain Testnet ZRC20 tokens
  7001: {
    baseSepolia: "0xd0eFed75622e7AA4555EE44F296dA3744E3ceE19", // USDC.BASESEPOLIA
    sepolia: "0xcC683A782f4B30c138787CB5576a86AF66fdc31d",     // USDC.SEPOLIA
    default: "0xd0eFed75622e7AA4555EE44F296dA3744E3ceE19"       // Use Base Sepolia by default
  },
  // Base Sepolia native USDC
  84532: {
    default: "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
  }
};

// Contract addresses - will be updated after deployment
export const CONTRACT_ADDRESSES = {
  // ZetaChain Testnet
  7001: {
    dragonSwapManager: '', // Fill after deployment
    usdc: USDC_ADDRESSES[7001].default,
    systemContract: "0xEdf1c3275d13489aCdC6cD6eD246E72458B8795B",
    gateway: "0x6c533f7fe93fae114d0954697069df33c9b74fd7",
    markets: [] // Fill after deployment
  },
  // Base Sepolia
  84532: {
    dragonSwapManager: '', // Fill after deployment
    usdc: USDC_ADDRESSES[84532].default,
    systemContract: ethers.ZeroAddress,
    gateway: "0x0c487a766110c85d301d96e33579c5b317fa4995",
    markets: [] // Fill after deployment
  }
};

// USDC configuration
export const USDC_CONFIG = {
  7001: {
    symbol: "USDC",
    decimals: 6,
    type: "ZRC20",
    name: "USD Coin (Base Sepolia)"
  },
  84532: {
    symbol: "USDC",
    decimals: 6,
    type: "ERC20",
    name: "USD Coin"
  }
};

// Standard ERC20 ABI for USDC
export const USDC_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)"
];

// Contract helper functions
export function getUSDCContract(provider: ethers.Provider, chainId: number) {
  const address = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.usdc;
  if (!address) throw new Error(`USDC not configured for chain ${chainId}`);
  
  return new Contract(address, USDC_ABI, provider);
}

export function getUSDCWithSigner(signer: ethers.Signer, chainId: number) {
  const address = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.usdc;
  if (!address) throw new Error(`USDC not configured for chain ${chainId}`);
  
  return new Contract(address, USDC_ABI, signer);
}

export function getDragonSwapManagerContract(provider: ethers.Provider, chainId: number) {
  const address = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.dragonSwapManager;
  if (!address) throw new Error(`DragonSwapManager not deployed on chain ${chainId}`);
  
  return new Contract(address, DRAGON_SWAP_MANAGER_ABI, provider);
}

export function getMarketContract(provider: ethers.Provider, marketAddress: string) {
  return new Contract(marketAddress, MARKET_ABI, provider);
}

// Helper function to format USDC amounts
export function formatUSDC(amount: ethers.BigNumberish, chainId: number): string {
  const config = USDC_CONFIG[chainId as keyof typeof USDC_CONFIG];
  return ethers.formatUnits(amount, config?.decimals || 6);
}

// Helper function to parse USDC amounts
export function parseUSDC(amount: string, chainId: number): ethers.BigNumberish {
  const config = USDC_CONFIG[chainId as keyof typeof USDC_CONFIG];
  return ethers.parseUnits(amount, config?.decimals || 6);
}

// Placeholder ABIs - copy from artifacts after compilation
export const DRAGON_SWAP_MANAGER_ABI = []; 
export const MARKET_ABI = [];