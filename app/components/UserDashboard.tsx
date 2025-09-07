"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useUser } from "@civic/auth-web3/react";
import { useBaseSepoliaContracts } from '../hooks/useZetaChainContracts';
import { useGolemDB } from '../hooks/useGolemDB';
import { ethers } from 'ethers';

interface UserPosition {
    marketAddress: string;
    question: string;
    yesShares: bigint;
    noShares: bigint;
    deposited: bigint;
    currentValue: number;
    pnl: number;
}

interface GolemParticipation {
    id: string;
    taskName: string;
    status: string;
    earnings: number;
    timestamp: Date;
    type: string;
    marketId?: string;
    txHash?: string;
    network?: string; // Add this
}

export default function UserDashboard() {
    const { address } = useAccount();
    const { user } = useUser();
    const { getAllMarkets, getMarketData, contracts } = useBaseSepoliaContracts();
    const { getEvents, getLeaderboard } = useGolemDB();
    
    const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
    const [golemParticipations, setGolemParticipations] = useState<GolemParticipation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'positions' | 'golem'>('positions');

    const fetchUserPositions = async () => {
        if (!address) return;
        
        setIsLoading(true);
        try {
            const markets = await getAllMarkets();
            const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
            
            const positions: UserPosition[] = [];
            
            for (const market of markets) {
                try {
                    const marketContract = new ethers.Contract(
                        market.address, 
                        [
                            "function getUserPosition(address user) view returns (uint256 yes, uint256 no, uint256 deposited)"
                        ], 
                        provider
                    );
                    
                    const [yesShares, noShares, deposited] = await marketContract.getUserPosition(address);
                    
                    if (yesShares > 0n || noShares > 0n) {
                        const totalShares = yesShares + noShares;
                        const currentValue = Number(ethers.formatUnits(totalShares, 6)) * 
                                           (Number(yesShares) > Number(noShares) ? market.yesPrice : market.noPrice);
                        const pnl = currentValue - Number(ethers.formatUnits(deposited, 6));
                        
                        positions.push({
                            marketAddress: market.address,
                            question: market.question,
                            yesShares,
                            noShares,
                            deposited,
                            currentValue,
                            pnl
                        });
                    }
                } catch (error) {
                    console.error(`Error fetching position for market ${market.address}:`, error);
                }
            }
            
            setUserPositions(positions);
        } catch (error) {
            console.error('Error fetching user positions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchGolemParticipations = async () => {
        if (!user?.id) return;
        
        try {
            // Fetch user's events from GolemDB with user filter
            const userEvents = await getEvents(user.id);
            
            // Filter events for the current user and relevant types
            const userParticipations = userEvents
                .map(event => {
                    let taskName = '';
                    let earnings = 0;
                    let status = 'Completed';
                    
                    switch (event.type) {
                        case 'market_created':
                            taskName = `Created Market: ${event.data?.question || 'Unknown Market'}`;
                            earnings = 0;
                            status = 'Completed';
                            break;
                        case 'market_joined':
                        case 'golem_market_joined':
                            taskName = `Joined Golem Market (${event.data?.side || 'Unknown'})`;
                            earnings = parseFloat(event.data?.amount || '0');
                            status = 'Completed';
                            break;
                        case 'zeta_market_joined':
                            const market = event.marketId ? 
                                `Market ${event.marketId.substring(0, 8)}...` : 
                                'Unknown Market';
                            taskName = `Joined Base Market: ${market} (${event.data?.side || 'Unknown'})`;
                            earnings = parseFloat(event.data?.amount || '0');
                            status = 'Completed';
                            break;
                        case 'zeta_market_join_failed':
                        case 'golem_market_join_failed':
                            taskName = `Failed to Join Market (${event.data?.side || 'Unknown'})`;
                            earnings = 0;
                            status = 'Failed';
                            break;
                        case 'market_resolved':
                            taskName = `Market Resolved: ${event.marketId}`;
                            earnings = parseFloat(event.data?.payout || '0');
                            status = 'Completed';
                            break;
                        case 'compute_task':
                            taskName = `Compute Task: ${event.data?.taskType || 'Unknown Task'}`;
                            earnings = parseFloat(event.data?.reward || '0');
                            status = event.data?.status || 'Completed';
                            break;
                        default:
                            taskName = `${event.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}: ${event.marketId || 'General Activity'}`;
                            earnings = 0;
                            status = 'Completed';
                    }
                    
                    return {
                        id: event.id || `${event.timestamp}-${Math.random()}`,
                        taskName,
                        status,
                        earnings,
                        timestamp: new Date(event.timestamp),
                        type: event.type,
                        marketId: event.marketId,
                        txHash: event.data?.txHash,
                        network: event.data?.network || 'unknown'
                    };
                })
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // Sort by newest first
                .slice(0, 20); // Limit to recent 20 activities
            
            setGolemParticipations(userParticipations);
        } catch (error) {
            console.error('Error fetching GolemDB participations:', error);
            // Fallback to empty array on error
            setGolemParticipations([]);
        }
    };

    useEffect(() => {
        if (address) {
            fetchUserPositions();
        }
        if (user?.id) {
            fetchGolemParticipations();
        }
    }, [address, user?.id]);

    if (!address) {
        return (
            <div className="rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">User Dashboard</h2>
                <p className="text-gray-600">Please connect your wallet to view your dashboard.</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">User Dashboard</h2>
            
            <div className="mb-6">
                <div className="flex space-x-4 border-b">
                    <button
                        onClick={() => setActiveTab('positions')}
                        className={`pb-2 px-4 ${
                            activeTab === 'positions'
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-600'
                        }`}
                    >
                        Market Positions
                    </button>
                    <button
                        onClick={() => setActiveTab('golem')}
                        className={`pb-2 px-4 ${
                            activeTab === 'golem'
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-600'
                        }`}
                    >
                        Activity History ({golemParticipations.length})
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your data...</p>
                </div>
            )}

            {activeTab === 'positions' && !isLoading && (
                <div>
                    <h3 className="text-lg font-semibold mb-6">Your Market Positions</h3>
                    {userPositions.length === 0 ? (
                        <div className="bg-gray-50 rounded-lg p-8 text-center">
                            <p className="text-gray-600">No positions found.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {userPositions.map((position, index) => (
                                <div key={index} className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-lg transition-all duration-200">
                                    {/* Market Title */}
                                    <div className="mb-6">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
                                            {position.question}
                                        </h4>
                                        <p className="text-sm text-gray-500 font-mono">
                                            {position.marketAddress.substring(0, 8)}...{position.marketAddress.slice(-6)}
                                        </p>
                                    </div>
                                    
                                    {/* Position & Financial Info */}
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        {/* Position Badge */}
                                        <div className="flex items-center gap-3">
                                            {Number(position.yesShares) > Number(position.noShares) ? (
                                                <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-medium bg-green-100 text-green-800">
                                                    YES Position
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-medium bg-red-100 text-red-800">
                                                    NO Position
                                                </span>
                                            )}
                                            <span className="text-sm text-gray-600">
                                                {Number(ethers.formatUnits(
                                                    position.yesShares + position.noShares, 
                                                    6
                                                )).toFixed(2)} shares
                                            </span>
                                        </div>
                                        
                                        {/* Financial Stats */}
                                        <div className="flex gap-8">
                                            <div className="text-center">
                                                <p className="text-sm text-gray-500 mb-1">Invested</p>
                                                <p className="text-xl font-semibold text-gray-900">
                                                    ${Number(ethers.formatUnits(position.deposited, 6)).toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-gray-500 mb-1">Current Value</p>
                                                <p className="text-xl font-semibold text-gray-900">
                                                    ${position.currentValue.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-gray-500 mb-1">P&L</p>
                                                <div className={`text-xl font-bold ${
                                                    position.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                                                </div>
                                                <div className={`text-sm font-medium ${
                                                    position.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                                                }`}>
                                                    {((position.pnl / Number(ethers.formatUnits(position.deposited, 6))) * 100).toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'golem' && !isLoading && (
                <div>
                    <h3 className="text-lg font-semibold mb-6">Activity History</h3>
                    {golemParticipations.length === 0 ? (
                        <div className="bg-gray-50 rounded-lg p-8 text-center">
                            <p className="text-gray-600">No activity found.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {golemParticipations.map((participation) => (
                                <div key={participation.id} className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-lg transition-all duration-200">
                                    {/* Task Title */}
                                    <div className="mb-6">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
                                            {participation.taskName}
                                        </h4>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>
                                                {participation.timestamp.toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                            <span className="font-mono text-xs">
                                                Type: {participation.type}
                                            </span>
                                            {participation.network && (
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                                    participation.network === 'base-sepolia' 
                                                        ? 'bg-blue-100 text-blue-800' 
                                                        : 'bg-purple-100 text-purple-800'
                                                }`}>
                                                    {participation.network}
                                                </span>
                                            )}
                                            {participation.txHash && (
                                                <span className="font-mono text-xs">
                                                    TX: {participation.txHash.substring(0, 8)}...
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Status & Earnings */}
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        {/* Status Badge */}
                                        <div>
                                            <span className={`inline-flex items-center px-4 py-2 rounded-full text-base font-medium ${
                                                participation.status === 'Completed' 
                                                    ? 'bg-green-100 text-green-800'
                                                    : participation.status === 'Failed'
                                                    ? 'bg-red-100 text-red-800'
                                                    : participation.status === 'In Progress'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {participation.status}
                                            </span>
                                        </div>
                                        
                                        {/* Earnings */}
                                        <div className="text-center">
                                            <p className="text-sm text-gray-500 mb-1">
                                                {participation.type.includes('market') ? 'Amount' : 'Earnings'}
                                            </p>
                                            <p className="text-xl font-semibold text-gray-900">
                                                {participation.earnings > 0 
                                                    ? `$${participation.earnings.toFixed(2)}` 
                                                    : 'N/A'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}