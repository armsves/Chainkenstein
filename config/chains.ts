import { ChainConfig } from '../types';

export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    id: 8453, // Base
    name: 'Base',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    contracts: {
      marketFactory: '0x...', // To be deployed
      dragonSwapRouter: '0x...', // DragonSwap router address
    }
  },
  {
    id: 7000, // ZetaChain
    name: 'ZetaChain',
    symbol: 'ZETA',
    rpcUrl: 'https://zetachain-evm.blockpi.network/v1/rpc/public',
    blockExplorer: 'https://zetachain.blockscout.com',
    contracts: {
      zetaConnector: '0x...', // To be deployed
    }
  }
];

export const getChainConfig = (chainId: number): ChainConfig | undefined => {
  return SUPPORTED_CHAINS.find(chain => chain.id === chainId);
};