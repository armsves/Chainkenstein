import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { parseAbi } from 'viem'
import { useWalletClient, usePublicClient } from 'wagmi';
import { CONTRACTS, MARKET_QUESTIONS } from '../../config/contracts';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";

// Simple ABI for the contracts - you can expand these based on your actual contract ABIs
const MARKET_ABI = [
    "function question() view returns (string)",
    "function endTime() view returns (uint64)",
    "function isResolved() view returns (bool)",
    "function yesShares() view returns (uint256)",
    "function noShares() view returns (uint256)",
    "function join(uint8 side, uint256 amount, bytes calldata civicProof)",
    "function getOdds() view returns (uint256 yesPrice, uint256 noPrice)",
    "function getUserPosition(address user) view returns (uint256 yes, uint256 no, uint256 deposited)",
    "function getMarketInfo() view returns (string memory _question, uint64 _endTime, address _payoutToken, bool _isResolved, uint8 _winner, uint256 _yesShares, uint256 _noShares, uint256 _totalLiquidity)",
    "function redeem()",
    "function winner() view returns (uint8)",
    "function totalLiquidity() view returns (uint256)"
] as const;

const DRAGON_SWAP_MANAGER_ABI = [
    "function getMarkets() view returns (address[])",
    "function createMarket(string question, uint256 endTime, address token, bytes32 civicRule, address civicGateway) returns (address)",
    "function owner() view returns (address)"
] as const;

const ERC20_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)"
] as const;

export interface BaseSepoliaMarket {
    address: string;
    question: string;
    endTime: number;
    isResolved: boolean;
    yesShares: bigint;
    noShares: bigint;
    yesPrice: number;
    noPrice: number;
}

export function useBaseSepoliaContracts() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Use wagmi hooks to get wallet client
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();

    // Wagmi write contract hooks
    const { writeContract, isSuccess } = useWriteContract();
    const { writeContractAsync: writeUSDCContract, isPending: isUSDCTxPending } = useWriteContract();

    const getProvider = useCallback(() => {
        return new ethers.JsonRpcProvider('https://sepolia.base.org');
    }, []);

    const getSigner = useCallback(async () => {
        if (!walletClient) {
            throw new Error('No wallet connected. Please connect your wallet first.');
        }

        // Convert viem wallet client to ethers signer
        const provider = new ethers.BrowserProvider(walletClient);
        return await provider.getSigner();
    }, [walletClient]);

    const getMarketData = useCallback(async (marketAddress: string): Promise<BaseSepoliaMarket> => {
        const provider = getProvider();
        const marketContract = new ethers.Contract(marketAddress, MARKET_ABI, provider);

        const [question, endTime, isResolved, yesShares, noShares] = await Promise.all([
            marketContract.question(),
            marketContract.endTime(),
            marketContract.isResolved(),
            marketContract.yesShares(),
            marketContract.noShares()
        ]);

        // Calculate prices based on current shares (simple AMM formula)
        const totalShares = yesShares + noShares;
        const yesPrice = totalShares > 0n ? Number(yesShares) / Number(totalShares) : 0.5;
        const noPrice = 1 - yesPrice;

        return {
            address: marketAddress,
            question,
            endTime: Number(endTime),
            isResolved,
            yesShares,
            noShares,
            yesPrice,
            noPrice
        };
    }, [getProvider]);

    const getAllMarkets = useCallback(async (): Promise<BaseSepoliaMarket[]> => {
        setIsLoading(true);
        setError(null);

        try {
            const marketPromises = CONTRACTS.BASE_SEPOLIA.markets.map((address, index) =>
                getMarketData(address).catch(error => {
                    console.error(`Failed to load market ${index + 1}:`, error);
                    // Return a fallback market with known data
                    return {
                        address,
                        question: MARKET_QUESTIONS[index] || `Market ${index + 1}`,
                        endTime: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days from now
                        isResolved: false,
                        yesShares: BigInt(1000000), // 1M shares
                        noShares: BigInt(1000000), // 1M shares
                        yesPrice: 0.5,
                        noPrice: 0.5
                    };
                })
            );

            const markets = await Promise.all(marketPromises);
            return markets;
        } catch (error) {
            console.error('Error fetching markets:', error);
            setError('Failed to fetch markets from Base Sepolia');
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [getMarketData]);

    const approveUSDC = useCallback(async (marketAddress: string, amount: string): Promise<string> => {
        if (!walletClient) {
            throw new Error('No wallet connected. Please connect your wallet first.');
        }

        const amountWei = ethers.parseUnits(amount, 6);

        const hash = await writeUSDCContract({
            address: CONTRACTS.BASE_SEPOLIA.USDC as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [marketAddress as `0x${string}`, amountWei],
        });

        console.log('USDC approval transaction sent:', hash);
        return hash;
    }, [writeUSDCContract, walletClient]);

    const buyShares = useCallback(async (
        marketAddress: string,
        isYes: boolean,
        amount: string
    ): Promise<string> => {
        setIsLoading(true);
        setError(null);

        try {
            if (!walletClient) {
                throw new Error('No wallet connected. Please connect your wallet first.');
            }

            const amountWei = ethers.parseUnits(amount, 6);
            const side = isYes ? 0 : 1;
            const civicProof = "0x";

            // Check current allowance first
            const provider = getProvider();
            const usdcContract = new ethers.Contract(CONTRACTS.BASE_SEPOLIA.USDC, ERC20_ABI, provider);
            const signer = await getSigner();
            const userAddress = await signer.getAddress();
            //const allowance = await usdcContract.allowance(userAddress, marketAddress);

            // Approve USDC if needed
            //if (allowance < amountWei) {
            //    console.log('Approving USDC...');
                console.log('Approving USDC for market:', marketAddress, 'amount:', amountWei.toString());
                console.log('User address:', userAddress);
                console.log('Current allowance:', (await usdcContract.allowance(userAddress, marketAddress)).toString());
                console.log('Amount to approve:', amountWei.toString());
                console.log('Market address:', marketAddress);
                console.log('USDC contract address:', CONTRACTS.BASE_SEPOLIA.USDC);
                console.log('USDC contract ABI:', ERC20_ABI);
                const approvalHash = await writeUSDCContract({
                    address: CONTRACTS.BASE_SEPOLIA.USDC as `0x${string}`,
                    abi: parseAbi(ERC20_ABI),
                    functionName: 'approve',
                    args: [marketAddress as `0x${string}`, amountWei],
                });
                console.log('USDC approval transaction sent:', approvalHash);

                // Wait for approval confirmation
                // You should implement proper transaction receipt waiting here
                //await new Promise(resolve => setTimeout(resolve, 5000));
            //}
            console.log('Joining market with params:', marketAddress, side, amountWei, civicProof);
            // Now call join function
            const hash = await writeContract({
                address: marketAddress as `0x${string}`,
                abi: parseAbi(MARKET_ABI),
                functionName: "join",
                args: [side, amountWei, civicProof as `0x${string}`],
            });

            console.log('Market join transaction sent:', hash);
            return '';

        } catch (error) {
            console.error('Error buying shares:', error);
            setError('Failed to buy shares');
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [writeContract, writeUSDCContract, walletClient, getProvider, getSigner]);

    const getUserBalance = useCallback(async (userAddress: string): Promise<string> => {
        try {
            // Check if the address is an ENS name and handle it appropriately
            if (!ethers.isAddress(userAddress)) {
                console.warn('Invalid address format:', userAddress);
                return '0';
            }

            const provider = getProvider();
            const usdcContract = new ethers.Contract(CONTRACTS.BASE_SEPOLIA.USDC, ERC20_ABI, provider);
            const balance = await usdcContract.balanceOf(userAddress);
            console.log('User balance (raw):', balance.toString());
            return ethers.formatUnits(balance, 6); // USDC has 6 decimals
        } catch (error) {
            console.error('Error getting user balance:', error);
            return '0';
        }
    }, [getProvider]);

    const switchToBaseSepolia = useCallback(async () => {
        if (!walletClient) {
            throw new Error('No wallet connected');
        }

        try {
            await walletClient.switchChain({ id: 84532 }); // Base Sepolia testnet ID
        } catch (switchError: any) {
            // If the chain isn't added, try to add it
            if (switchError.code === 4902) {
                try {
                    await walletClient.addChain({
                        id: 84532,
                        name: 'Base Sepolia',
                        network: 'base-sepolia',
                        nativeCurrency: {
                            name: 'ETH',
                            symbol: 'ETH',
                            decimals: 18,
                        },
                        rpcUrls: {
                            default: {
                                http: ['https://sepolia.base.org'],
                            },
                            public: {
                                http: ['https://sepolia.base.org'],
                            },
                        },
                        blockExplorers: {
                            default: {
                                name: 'Base Sepolia Explorer',
                                url: 'https://sepolia-explorer.base.org',
                            },
                        },
                    });
                } catch (addError) {
                    console.error('Failed to add Base Sepolia network:', addError);
                    throw addError;
                }
            } else {
                throw switchError;
            }
        }
    }, [walletClient]);

    return {
        getAllMarkets,
        getMarketData,
        buyShares,
        //getUserBalance,
        switchToBaseSepolia,
        isLoading: isLoading || isUSDCTxPending,
        error,
        contracts: CONTRACTS.BASE_SEPOLIA, // You might want to rename this in your config
        isWalletConnected: !!walletClient
    };
}