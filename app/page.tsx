"use client";

import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
} from "@coinbase/onchainkit/minikit";
import { UserButton, useUser } from "@civic/auth-web3/react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Button, Icon } from "./components/DemoComponents";
import { Overview } from './components/dashboard/Overview';
import { MarketCreator } from './components/prediction/MarketCreator';
import { Market, UserProfile } from '../types';
import { useGolemDB } from './hooks/useGolemDB';
import { useBaseSepoliaContracts, BaseSepoliaMarket } from './hooks/useZetaChainContracts';
import UserDashboard from './components/UserDashboard';

import { useAccount, useBalance } from "wagmi";
import { useAutoConnect } from "@civic/auth-web3/wagmi";


export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [frameAdded, setFrameAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'demo'>('overview');
  const { user } = useUser();
  useAutoConnect();
  const { address, isConnected } = useAccount();
  
  // Move useBalance to the top level
  const usdcBalance = useBalance({
    address,
    token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Base
  });

  // GolemDB hooks
  const { getMarkets, createMarket, writeEvent, getLeaderboard, isLoading: golemLoading, error: golemError } = useGolemDB();
  
  // ZetaChain hooks
  const { 
    getAllMarkets, 
    buyShares, 
    //getUserBalance, 
    switchToBaseSepolia,
    isLoading: zetaLoading, 
    error: zetaError,
    contracts
  } = useBaseSepoliaContracts();

  const [golemMarkets, setGolemMarkets] = useState<Market[]>([]);
  const [zetaMarkets, setZetaMarkets] = useState<BaseSepoliaMarket[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>(undefined);
  const [userBalance, setUserBalance] = useState<string>('0');
  const [isCreatingMarket, setIsCreatingMarket] = useState(false);

  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  useEffect(() => {
    loadGolemMarkets();
    loadZetaMarkets();
    if (user) {
      loadUserProfile();
      loadUserBalance();
    }
  }, [user]);

  const loadGolemMarkets = async () => {
    try {
      const fetchedMarkets = await getMarkets(true);
      setGolemMarkets(fetchedMarkets);
    } catch (error) {
      console.error('Failed to load GolemDB markets:', error);
    }
  };

  const loadZetaMarkets = async () => {
    try {
      const fetchedMarkets = await getAllMarkets();
      setZetaMarkets(fetchedMarkets);
    } catch (error) {
      console.error('Failed to load ZetaChain markets:', error);
    }
  };

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const leaderboard = await getLeaderboard();
      const profile = leaderboard.find(p => p.address === user.id);
      
      if (profile) {
        setUserProfile(profile);
      } else {
        setUserProfile({
          address: user.id || 'anonymous',
          totalVolume: BigInt(0),
          totalPnL: BigInt(0),
          marketsWon: 0,
          marketsTotal: 0,
          winRate: 0,
          rank: 0,
        });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  // Update loadUserBalance to use the hook data
  const loadUserBalance = useCallback(() => {
    if (!user?.id || !usdcBalance.data) return;
    
    try {
      setUserBalance(usdcBalance.data.formatted || '0');
    } catch (error) {
      console.error('Failed to load user balance:', error);
      setUserBalance('0');
    }
  }, [user?.id, usdcBalance.data]);

  // Update useEffect to watch for balance changes
  useEffect(() => {
    if (usdcBalance.data) {
      loadUserBalance();
    }
  }, [usdcBalance.data, loadUserBalance]);

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame();
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame]);

  const handleCreateMarket = async (data: {
    question: string;
    endTime: number;
    initialLiquidity: string;
    civicGated: boolean;
  }) => {
    if (!user) {
      alert('Please sign in to create markets');
      return;
    }

    setIsCreatingMarket(true);
    
    try {
      // Create market in GolemDB (for analytics/tracking)
      const marketId = await createMarket({
        question: data.question,
        endTime: data.endTime,
        creator: user.id || 'anonymous',
        civicRule: data.civicGated ? 'kyc-required' : '',
        payoutToken: contracts.USDC,
        yesShares: BigInt(data.initialLiquidity) * BigInt(1e6) / BigInt(2),
        noShares: BigInt(data.initialLiquidity) * BigInt(1e6) / BigInt(2),
        totalLiquidity: BigInt(data.initialLiquidity) * BigInt(1e6),
        isResolved: false,
      });
      
      if (marketId) {
        await writeEvent({
          type: 'market_created',
          marketId,
          creator: user.id,
          data,
          timestamp: Date.now(),
        });
        
        await loadGolemMarkets();
        await loadUserProfile();
        setActiveTab('overview');
        
        alert('Market created successfully in GolemDB! Note: On-chain deployment would require additional contract interaction.');
      } else {
        throw new Error('Failed to create market in GolemDB');
      }
    } catch (error) {
      console.error('Error creating market:', error);
      alert('Failed to create market. Please try again.');
    } finally {
      setIsCreatingMarket(false);
    }
  };

  const handleJoinZetaMarket = async (marketAddress: string, side: 'YES' | 'NO', amount: string = '0.1') => {
    if (!user) {
      alert('Please sign in to join markets');
      return;
    }

    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    const finalAmount = '0.1';

    try {
      // First ensure user is on Base Sepolia
      await switchToBaseSepolia();

      // Add a small delay to ensure network switch is complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check user's USDC balance before proceeding
      const requiredAmount = parseFloat(finalAmount);
      const currentBalance = parseFloat(userBalance);
      
      if (currentBalance < requiredAmount) {
        alert(`Insufficient USDC balance. Required: ${requiredAmount}, Available: ${currentBalance}`);
        return;
      }
      
      // Buy shares on ZetaChain with 0.1 USDC
      const txHash = await buyShares(marketAddress, side === 'YES', finalAmount);
      
      // Record in GolemDB for analytics - Enhanced event data
      await writeEvent({
        type: 'zeta_market_joined',
        marketId: marketAddress,
        user: user.id,
        data: { 
          side, 
          amount: finalAmount, 
          txHash,
          timestamp: Date.now(),
          walletAddress: address,
          network: 'base-sepolia',
          priceAtPurchase: side === 'YES' ? 0.5 : 0.5, // You can get actual price from market data
        },
        timestamp: Date.now(),
      });
      
      // Reload data
      await loadUserProfile();
      await loadZetaMarkets();
      
      alert(`Successfully bought ${side} shares for ${finalAmount} USDC on ZetaChain! TX: ${txHash}`);
    } catch (error) {
      console.error('Error joining ZetaChain market:', error);
      
      // Write failed attempt to GolemDB as well
      try {
        await writeEvent({
          type: 'zeta_market_join_failed',
          marketId: marketAddress,
          user: user.id,
          data: { 
            side, 
            amount: finalAmount, 
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
            walletAddress: address,
          },
          timestamp: Date.now(),
        });
      } catch (writeError) {
        console.error('Failed to write error event:', writeError);
      }
      
      // More specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('No wallet found')) {
        alert('Please connect your wallet first. Make sure MetaMask or another Web3 wallet is installed and connected.');
      } else if (errorMessage.includes('User rejected')) {
        alert('Transaction was cancelled by user.');
      } else if (errorMessage.includes('insufficient funds')) {
        alert('Insufficient funds for gas or token amount.');
      } else if (errorMessage.includes('RPC error') || errorMessage.includes('could not coalesce error')) {
        alert('Network connection error. Please check your internet connection and try again. You may also try switching networks and back to ZetaChain.');
      } else {
        alert(`Failed to join market: ${errorMessage}`);
      }
    }
  };

  const handleJoinGolemMarket = async (marketId: string, side: 'YES' | 'NO', amount: string) => {
    if (!user) {
      alert('Please sign in to join markets');
      return;
    }

    try {
      // Enhanced GolemDB event writing
      await writeEvent({
        type: 'golem_market_joined',
        marketId,
        user: user.id,
        data: { 
          side, 
          amount,
          timestamp: Date.now(),
          walletAddress: address || 'not-connected',
          network: 'golem-testnet',
        },
        timestamp: Date.now(),
      });
      
      await loadUserProfile();
      alert(`Joined GolemDB market with ${amount} USDC on ${side}!`);
    } catch (error) {
      console.error('Error joining GolemDB market:', error);
      
      // Write failed attempt
      try {
        await writeEvent({
          type: 'golem_market_join_failed',
          marketId,
          user: user.id,
          data: { 
            side, 
            amount, 
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
        });
      } catch (writeError) {
        console.error('Failed to write error event:', writeError);
      }
      
      alert('Failed to join market. Please try again.');
    }
  };

  const handleViewMarket = (marketId: string) => {
    console.log('Viewing market:', marketId);
    // Navigate to market detail view (to be implemented)
  };

  // Combine markets from both sources for display
  const combinedMarkets = useMemo(() => {
    const golemMarketsFormatted = golemMarkets.map(market => ({
      ...market,
      source: 'golem' as const,
      yesPrice: 0.5, // Default for display
      noPrice: 0.5,
    }));
    
    const zetaMarketsFormatted = zetaMarkets.map(market => ({
      id: market.address,
      question: market.question,
      endTime: market.endTime,
      creator: 'ZetaChain',
      civicRule: '',
      payoutToken: contracts.USDC,
      yesShares: market.yesShares,
      noShares: market.noShares,
      totalLiquidity: market.yesShares + market.noShares,
      isResolved: market.isResolved,
      source: 'zeta' as const,
      yesPrice: market.yesPrice,
      noPrice: market.noPrice,
      address: market.address,
      createdAt: Date.now(),
    }));
    
    return [...golemMarketsFormatted, ...zetaMarketsFormatted];
  }, [golemMarkets, zetaMarkets, contracts.USDC]);

  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddFrame}
          className="text-[var(--app-accent)] p-2"
          icon={<Icon name="plus" size="sm" />}
        >
          Save
        </Button>
      );
    }

    if (frameAdded) {
      return (
        <div className="flex items-center space-x-1 text-sm font-medium text-[#0052FF] animate-fade-out">
          <Icon name="check" size="sm" className="text-[#0052FF]" />
          <span>Saved</span>
        </div>
      );
    }

    return null;
  }, [context, frameAdded, handleAddFrame]);

  const isLoading = golemLoading || zetaLoading;
  const error = golemError || zetaError;

  return (
    <div className="min-h-screen">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        {/* Header */}
        <header className="flex justify-between items-center mb-4 h-11">
          <div className="flex items-center space-x-2">
            <UserButton />
            {user && (
              <div className="text-xs text-[var(--app-foreground-muted)]">
                USDC: {parseFloat(userBalance).toFixed(2)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <div className="text-xs text-red-400">Error: {error}</div>
            )}
            {isLoading && (
              <div className="text-xs text-yellow-400">Loading...</div>
            )}
            {saveFrameButton}
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 mb-4 bg-[var(--app-card-bg)] rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-[var(--app-accent)] text-white'
                : 'text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)]'
            }`}
          >
            Markets ({combinedMarkets.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            disabled={!user}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-[var(--app-accent)] text-white'
                : 'text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)] disabled:opacity-50'
            }`}
          >
            Create
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'demo'
                ? 'bg-[var(--app-accent)] text-white'
                : 'text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)]'
            }`}
          >
            Demo
          </button>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-8 px-4">
          {activeTab === 'overview' && (
            <Overview
              userProfile={userProfile}
              trendingMarkets={combinedMarkets}
              onJoinMarket={(marketId, side, amount) => {
                const market = combinedMarkets.find(m => m.id === marketId);
                if (market?.source === 'zeta') {
                  return handleJoinZetaMarket(market.address || marketId, side, amount);
                } else {
                  return handleJoinGolemMarket(marketId, side, amount);
                }
              }}
              onViewMarket={handleViewMarket}
            />
          )}
          
          {activeTab === 'create' && (
            <MarketCreator
              onCreateMarket={handleCreateMarket}
              isCreating={isCreatingMarket}
            />
          )}
          
          {activeTab === 'demo' && (
            <div className="space-y-6">
              <div className="bg-[var(--app-card-bg)] backdrop-blur-md rounded-xl shadow-lg border border-[var(--app-card-border)] p-6">
                <h3 className="text-lg font-semibold text-[var(--app-foreground)] mb-4">
                  Multi-Chain Integration Status
                </h3>
                <div className="text-sm text-[var(--app-foreground-muted)] space-y-2">
                  <p>✅ GolemDB Chain {process.env.CHAIN_ID || '60138453033'}</p>
                  <p>✅ ZetaChain Testnet (Chain ID: 7001)</p>
                  <p>📊 GolemDB Markets: {golemMarkets.length}</p>
                  <p>🔗 ZetaChain Markets: {zetaMarkets.length}</p>
                  <p>👤 User Profile: {userProfile ? 'Loaded' : 'None'}</p>
                  <p>💰 USDC Balance: {userBalance} USDC</p>
                </div>
                
                <div className="mt-4 space-y-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      loadGolemMarkets();
                      loadZetaMarkets();
                    }}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Loading...' : 'Refresh All Markets'}
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={switchToBaseSepolia}
                    className="w-full"
                  >
                    Switch to ZetaChain Network
                  </Button>
                  
                  {user && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        loadUserProfile();
                        loadUserBalance();
                      }}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Loading...' : 'Refresh User Data'}
                    </Button>
                  )}
                </div>
                
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-blue-400 text-sm">
                    <strong>Live Contracts on ZetaChain:</strong><br/>
                    DragonSwapManager: {contracts.dragonSwapManager}<br/>
                    {zetaMarkets.length} active prediction markets
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Add the dashboard */}
          <div className="mb-8">
            <UserDashboard />
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-2 pt-4 flex justify-center border-t border-[var(--app-card-border)]">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--ock-text-foreground-muted)] text-xs"
            onClick={() => openUrl("https://base.org/builders/minikit")}
          >
            Built on Base + ZetaChain with MiniKit + GolemDB
          </Button>
        </footer>
      </div>
    </div>
  );
}
