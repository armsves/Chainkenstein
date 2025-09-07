"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useBaseSepoliaContracts } from '../hooks/useZetaChainContracts';
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
}

export default function UserDashboard() {
    const { address } = useAccount();
    const { getAllMarkets, getMarketData, contracts } = useBaseSepoliaContracts();
    
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
        // Mock data for now - replace with actual GolemDB integration
        const mockData: GolemParticipation[] = [
            {
                id: '1',
                taskName: 'AI Model Training Task #123',
                status: 'Completed',
                earnings: 15.50,
                timestamp: new Date('2024-01-15')
            },
            {
                id: '2',
                taskName: 'Data Processing Task #456',
                status: 'In Progress',
                earnings: 0,
                timestamp: new Date('2024-01-20')
            },
            {
                id: '3',
                taskName: 'Rendering Task #789',
                status: 'Completed',
                earnings: 8.25,
                timestamp: new Date('2024-01-18')
            }
        ];
        
        setGolemParticipations(mockData);
    };

    useEffect(() => {
        if (address) {
            fetchUserPositions();
            fetchGolemParticipations();
        }
    }, [address]);

    if (!address) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">User Dashboard</h2>
                <p className="text-gray-600">Please connect your wallet to view your dashboard.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
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
                        Golem Participations
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
                    <h3 className="text-lg font-semibold mb-4">Your Market Positions</h3>
                    {userPositions.length === 0 ? (
                        <p className="text-gray-600">No positions found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full table-auto">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 text-left">Market</th>
                                        <th className="px-4 py-2 text-left">Position</th>
                                        <th className="px-4 py-2 text-right">Invested</th>
                                        <th className="px-4 py-2 text-right">Current Value</th>
                                        <th className="px-4 py-2 text-right">P&L</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userPositions.map((position, index) => (
                                        <tr key={index} className="border-t">
                                            <td className="px-4 py-2">
                                                <div className="font-medium text-sm">
                                                    {position.question.substring(0, 50)}...
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {position.marketAddress.substring(0, 8)}...
                                                </div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="text-sm">
                                                    {Number(position.yesShares) > Number(position.noShares) ? (
                                                        <span className="text-green-600 font-medium">YES</span>
                                                    ) : (
                                                        <span className="text-red-600 font-medium">NO</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {ethers.formatUnits(
                                                        position.yesShares + position.noShares, 
                                                        6
                                                    )} shares
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                ${Number(ethers.formatUnits(position.deposited, 6)).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                ${position.currentValue.toFixed(2)}
                                            </td>
                                            <td className={`px-4 py-2 text-right font-medium ${
                                                position.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'golem' && !isLoading && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Golem Network Participations</h3>
                    {golemParticipations.length === 0 ? (
                        <p className="text-gray-600">No Golem participations found.</p>
                    ) : (
                        <div className="space-y-4">
                            {golemParticipations.map((participation) => (
                                <div key={participation.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-medium text-lg">{participation.taskName}</h4>
                                            <p className="text-sm text-gray-600">
                                                {participation.timestamp.toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                                participation.status === 'Completed' 
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {participation.status}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <span className="text-lg font-semibold">
                                            ${participation.earnings.toFixed(2)} GLM
                                        </span>
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