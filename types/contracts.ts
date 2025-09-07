export interface ZetaChainMarket {
  address: string;
  question: string;
  endTime: number;
  isResolved: boolean;
  yesShares: bigint;
  noShares: bigint;
  yesPrice: number;
  noPrice: number;
}

export interface ExtendedMarket {
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
  source: 'golem' | 'zeta';
  yesPrice: number;
  noPrice: number;
  address?: string;
}
