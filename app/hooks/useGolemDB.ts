import { useState, useCallback } from 'react';
import { Market, Position, UserProfile } from '../../types';

export function useGolemDB() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = async (endpoint: string, options?: RequestInit) => {
    const response = await fetch(`/api/golemdb${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  };

  const getMarkets = useCallback(async (live?: boolean): Promise<Market[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (live) params.append('live', 'true');
      
      const result = await apiCall(`/markets?${params.toString()}`);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch markets');
      }
      
      const markets: Market[] = result.markets.map((market: any) => ({
        ...market,
        yesShares: BigInt(market.yesShares),
        noShares: BigInt(market.noShares),
        totalLiquidity: BigInt(market.totalLiquidity),
      }));

      return markets;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch markets';
      setError(errorMessage);
      console.error('Error fetching markets:', err);
      
      // Return empty array instead of mock data
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getMarket = useCallback(async (id: string): Promise<Market | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const markets = await getMarkets();
      return markets.find(m => m.id === id) || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getMarkets]);

  const createMarket = useCallback(async (marketData: Omit<Market, 'id' | 'createdAt'>): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const payload = {
        question: marketData.question,
        endTime: marketData.endTime,
        initialLiquidity: (Number(marketData.totalLiquidity) / 1e6).toString(),
        civicGated: marketData.civicRule === 'kyc-required',
        creator: marketData.creator,
      };

      const result = await apiCall('/markets', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create market');
      }

      return result.market.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create market';
      setError(errorMessage);
      console.error('Error creating market:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const writePosition = useCallback(async (position: Position): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await apiCall('/positions', {
        method: 'POST',
        body: JSON.stringify({
          marketId: position.marketId,
          user: position.user,
          side: position.side,
          amount: position.amount.toString(),
          shares: position.shares.toString(),
          chain: position.chain,
          txHash: position.txHash,
        }),
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to write position');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to write position';
      setError(errorMessage);
      console.error('Error writing position:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getLeaderboard = useCallback(async (marketId?: string): Promise<UserProfile[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (marketId) params.append('marketId', marketId);
      
      const result = await apiCall(`/positions?${params.toString()}`);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch positions');
      }

      // Process positions to calculate leaderboard
      const userStats: Record<string, UserProfile> = {};
      
      result.positions.forEach((position: any) => {
        if (!userStats[position.user]) {
          userStats[position.user] = {
            address: position.user,
            totalVolume: BigInt(0),
            totalPnL: BigInt(0),
            marketsWon: 0,
            marketsTotal: 0,
            winRate: 0,
            rank: 0,
          };
        }
        
        userStats[position.user].totalVolume += BigInt(position.amount);
        userStats[position.user].marketsTotal += 1;
      });
      
      // Convert to array and sort by volume
      const leaderboard = Object.values(userStats)
        .sort((a, b) => Number(b.totalVolume - a.totalVolume))
        .map((user, index) => ({
          ...user,
          rank: index + 1,
          winRate: user.marketsTotal > 0 ? (user.marketsWon / user.marketsTotal) * 100 : 0,
        }));

      return leaderboard.slice(0, 20); // Top 20
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leaderboard';
      setError(errorMessage);
      console.error('Error fetching leaderboard:', err);
      
      // Return empty array instead of mock data
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const writeEvent = useCallback(async (event: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await apiCall('/events', {
        method: 'POST',
        body: JSON.stringify(event),
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to write event');
      }

      console.log('Event written to GolemDB:', result.entityKey);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to write event';
      setError(errorMessage);
      console.error('Error writing event:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    getMarkets,
    getMarket,
    createMarket,
    writePosition,
    getLeaderboard,
    writeEvent,
  };
}