export interface Market {
  id: string;
  question: string;
  endTime: number;
  creator: string;
  civicRule: string;
  payoutToken: string;
  yesShares: bigint;
  noShares: bigint;
  totalLiquidity: bigint;
  isResolved: boolean;
  winner?: 'YES' | 'NO';
  createdAt: number;
}

export interface Position {
  marketId: string;
  user: string;
  side: 'YES' | 'NO';
  amount: bigint;
  shares: bigint;
  chain: string;
  txHash: string;
  timestamp: number;
}

export interface MarketSnapshot {
  marketId: string;
  tvl: bigint;
  yesShares: bigint;
  noShares: bigint;
  priceYes: number;
  timestamp: number;
}

export interface UserProfile {
  address: string;
  totalVolume: bigint;
  totalPnL: bigint;
  marketsWon: number;
  marketsTotal: number;
  winRate: number;
  rank: number;
}

export interface ChainConfig {
  id: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  blockExplorer: string;
  contracts: {
    marketFactory?: string;
    zetaConnector?: string;
    dragonSwapRouter?: string;
  };
}