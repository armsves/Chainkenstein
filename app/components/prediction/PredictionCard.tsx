"use client";

import { useState } from 'react';
import { Market } from '../../../types';
import { Button, Icon } from '../DemoComponents';
import { formatEther } from 'viem';

interface PredictionCardProps {
  market: Market;
  onJoin?: (marketId: string, side: 'YES' | 'NO', amount: string) => void;
  onView?: (marketId: string) => void;
}

export function PredictionCard({ market, onJoin, onView }: PredictionCardProps) {
  const [selectedSide, setSelectedSide] = useState<'YES' | 'NO' | null>(null);
  const [amount, setAmount] = useState('10');

  const totalShares = market.yesShares + market.noShares;
  const yesPrice = totalShares > 0 ? Number(market.yesShares * 100n / totalShares) : 50;
  const noPrice = 100 - yesPrice;

  const timeLeft = Math.max(0, market.endTime - Date.now() / 1000);
  const isExpired = timeLeft <= 0;
  const isActive = !market.isResolved && !isExpired;

  const formatTimeLeft = (seconds: number) => {
    if (seconds <= 0) return 'Expired';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 24) return `${Math.floor(hours / 24)}d`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleJoin = () => {
    if (selectedSide && onJoin) {
      onJoin(market.id, selectedSide, amount);
    }
  };

  return (
    <div className="bg-[var(--app-card-bg)] backdrop-blur-md rounded-xl shadow-lg border border-[var(--app-card-border)] p-6 hover:shadow-xl transition-all">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[var(--app-foreground)] mb-2 line-clamp-2">
            {market.question}
          </h3>
          <div className="flex items-center gap-4 text-sm text-[var(--app-foreground-muted)]">
            <span>TVL: ${formatEther(market.totalLiquidity)}</span>
            <span>{formatTimeLeft(timeLeft)}</span>
            {market.civicRule && (
              <span className="flex items-center gap-1 text-green-400">
                <Icon name="check" size="sm" />
                KYC Required
              </span>
            )}
          </div>
        </div>
        
        {market.isResolved && (
          <div className="flex items-center gap-1 text-green-400 text-sm font-medium">
            <Icon name="check" size="sm" />
            {market.winner}
          </div>
        )}
      </div>

      {/* Odds Display */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div 
          className={`p-3 rounded-lg border cursor-pointer transition-all ${
            selectedSide === 'YES' 
              ? 'border-green-400 bg-green-400/10' 
              : 'border-[var(--app-card-border)] hover:border-green-400/50'
          }`}
          onClick={() => isActive && setSelectedSide('YES')}
        >
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">{yesPrice}¢</div>
            <div className="text-sm text-[var(--app-foreground-muted)]">YES</div>
          </div>
        </div>
        
        <div 
          className={`p-3 rounded-lg border cursor-pointer transition-all ${
            selectedSide === 'NO' 
              ? 'border-red-400 bg-red-400/10' 
              : 'border-[var(--app-card-border)] hover:border-red-400/50'
          }`}
          onClick={() => isActive && setSelectedSide('NO')}
        >
          <div className="text-center">
            <div className="text-lg font-bold text-red-400">{noPrice}¢</div>
            <div className="text-sm text-[var(--app-foreground-muted)]">NO</div>
          </div>
        </div>
      </div>

      {/* Amount Input & Actions */}
      {isActive && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-[var(--app-foreground-muted)] mb-1">
              Amount (USDC)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--app-background)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none"
              placeholder="10"
              min="1"
              step="1"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleJoin}
              disabled={!selectedSide || !amount || Number(amount) <= 0}
              className="flex-1"
            >
              Join Market
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView?.(market.id)}
              icon={<Icon name="arrow-right" size="sm" />}
            >
              View
            </Button>
          </div>
        </div>
      )}

      {!isActive && !market.isResolved && (
        <div className="text-center py-3">
          <span className="text-[var(--app-foreground-muted)] text-sm">Market Expired</span>
        </div>
      )}
    </div>
  );
}