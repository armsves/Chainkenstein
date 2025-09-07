import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';
import { getUSDCContract, getUSDCWithSigner, formatUSDC, parseUSDC } from '../lib/contracts';

export function useUSDC() {
  const { provider, signer, address, chainId } = useWallet();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadBalance() {
      if (!provider || !address || !chainId) return;
      
      try {
        setLoading(true);
        const usdc = getUSDCContract(provider, chainId);
        const balanceBN = await usdc.balanceOf(address);
        setBalance(formatUSDC(balanceBN, chainId));
      } catch (error) {
        console.error('Error loading USDC balance:', error);
        setBalance('0');
      } finally {
        setLoading(false);
      }
    }

    loadBalance();
  }, [provider, address, chainId]);

  const approve = async (spender: string, amount: string) => {
    if (!signer || !chainId) throw new Error('Wallet not connected');
    
    const usdc = getUSDCWithSigner(signer, chainId);
    const amountBN = parseUSDC(amount, chainId);
    
    const tx = await usdc.approve(spender, amountBN);
    return tx.wait();
  };

  const getAllowance = async (spender: string): Promise<string> => {
    if (!provider || !address || !chainId) return '0';
    
    const usdc = getUSDCContract(provider, chainId);
    const allowanceBN = await usdc.allowance(address, spender);
    return formatUSDC(allowanceBN, chainId);
  };

  const transfer = async (to: string, amount: string) => {
    if (!signer || !chainId) throw new Error('Wallet not connected');
    
    const usdc = getUSDCWithSigner(signer, chainId);
    const amountBN = parseUSDC(amount, chainId);
    
    const tx = await usdc.transfer(to, amountBN);
    return tx.wait();
  };

  return {
    balance,
    loading,
    approve,
    getAllowance,
    transfer,
    formatUSDC: (amount: ethers.BigNumberish) => formatUSDC(amount, chainId || 7001),
    parseUSDC: (amount: string) => parseUSDC(amount, chainId || 7001)
  };
}