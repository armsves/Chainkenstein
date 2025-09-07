"use client";

import { useEffect, useState } from 'react';
import { Market, UserProfile } from '../../../types';
import { Button, Icon } from '../DemoComponents';

interface OverviewProps {
  userProfile?: UserProfile;
  trendingMarkets: Market[];
  onJoinMarket?: (marketId: string, side: 'YES' | 'NO', amount: string) => void;
  onViewMarket?: (marketId: string) => void;
}

export function Overview({ userProfile, trendingMarkets, onJoinMarket, onViewMarket }: OverviewProps) {
  const [stats, setStats] = useState({
    totalMarkets: 0,
    totalVolume: '$0',
    activeUsers: 0,
  });

  useEffect(() => {
    // Mock stats for demo
    setStats({
      totalMarkets: 42,
      totalVolume: '$125,430',
      activeUsers: 1337,
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* User Profile */}
      {userProfile && (
        <div className="bg-[var(--app-card-bg)] backdrop-blur-md rounded-xl shadow-lg border border-[var(--app-card-border)] p-6">
          <h2 className="text-xl font-bold text-[var(--app-foreground)] mb-4">
            Your Profile
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--app-accent)]">
                ${(Number(userProfile.totalVolume) / 1e6).toFixed(2)}
              </div>
              <div className="text-sm text-[var(--app-foreground-muted)]">Total Volume</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                ${(Number(userProfile.totalPnL) / 1e6).toFixed(2)}
              </div>
              <div className="text-sm text-[var(--app-foreground-muted)]">Total P&L</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--app-accent)]">
                {userProfile.marketsWon}/{userProfile.marketsTotal}
              </div>
              <div className="text-sm text-[var(--app-foreground-muted)]">Markets Won</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                #{userProfile.rank || 'New'}
              </div>
              <div className="text-sm text-[var(--app-foreground-muted)]">Global Rank</div>
            </div>
          </div>
        </div>
      )}

      {/* Markets Section */}
      <div className="bg-[var(--app-card-bg)] backdrop-blur-md rounded-xl shadow-lg border border-[var(--app-card-border)] p-6">
        <h2 className="text-xl font-bold text-[var(--app-foreground)] mb-4">
          Active Markets
        </h2>
        
        {trendingMarkets.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-[var(--app-foreground)] mb-2">
              No markets yet
            </h3>
            <p className="text-[var(--app-foreground-muted)] mb-4">
              Be the first to create a prediction market and start trading!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {trendingMarkets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                onJoinMarket={onJoinMarket}
                onViewMarket={onViewMarket}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MarketCard({ 
  market, 
  onJoinMarket, 
  onViewMarket 
}: { 
  market: Market; 
  onJoinMarket: (marketId: string, side: 'YES' | 'NO', amount: string) => void;
  onViewMarket: (marketId: string) => void;
}) {
  const totalShares = market.yesShares + market.noShares;
  const yesPercentage = totalShares > 0 ? Number(market.yesShares * BigInt(100) / totalShares) : 50;
  const noPercentage = 100 - yesPercentage;

  const timeUntilEnd = market.endTime - Math.floor(Date.now() / 1000);
  const daysLeft = Math.max(0, Math.floor(timeUntilEnd / 86400));
  const hoursLeft = Math.max(0, Math.floor((timeUntilEnd % 86400) / 3600));

  return (
    <div className="border border-[var(--app-card-border)] rounded-lg p-4 hover:bg-[var(--app-accent-light)] transition-colors">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-[var(--app-foreground)] flex-1 pr-2">
          {market.question}
        </h3>
        {market.civicRule && (
          <span className="bg-[var(--app-accent)] text-white text-xs px-2 py-1 rounded-full">
            KYC
          </span>
        )}
      </div>
      
      <div className="space-y-3">
        {/* Odds Display */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-sm font-medium">YES {yesPercentage}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">NO {noPercentage}%</span>
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-[var(--app-gray)] rounded-full h-2">
          <div 
            className="bg-green-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${yesPercentage}%` }}
          ></div>
        </div>
        
        {/* Market Info */}
        <div className="flex justify-between text-xs text-[var(--app-foreground-muted)]">
          <span>
            ${(Number(market.totalLiquidity) / 1e6).toFixed(2)} liquidity
          </span>
          <span>
            {daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h left` : hoursLeft > 0 ? `${hoursLeft}h left` : 'Ended'}
          </span>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onJoinMarket(market.id, 'YES', '10')}
            className="flex-1 bg-green-500 hover:bg-green-600"
            disabled={timeUntilEnd <= 0}
          >
            Buy YES
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onJoinMarket(market.id, 'NO', '10')}
            className="flex-1 bg-red-500 hover:bg-red-600"
            disabled={timeUntilEnd <= 0}
          >
            Buy NO
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewMarket(market.id)}
            icon={<Icon name="arrow-right" size="sm" />}
          >
          </Button>
        </div>
      </div>
    </div>
  );
}