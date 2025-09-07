"use client";

import { useState } from 'react';
import { SUPPORTED_CHAINS } from '../../../config/chains';
import { Icon } from '../DemoComponents';

interface ChainSelectorProps {
  selectedChainId: number;
  onChainChange: (chainId: number) => void;
  disabled?: boolean;
}

export function ChainSelector({ selectedChainId, onChainChange, disabled = false }: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedChain = SUPPORTED_CHAINS.find(chain => chain.id === selectedChainId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 bg-[var(--app-background)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[var(--app-accent)]/50'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[var(--app-accent)] to-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {selectedChain?.symbol.charAt(0) || '?'}
          </div>
          <span>{selectedChain?.name || 'Select Chain'}</span>
        </div>
        <Icon 
          name="arrow-right" 
          size="sm" 
          className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`} 
        />
      </button>

      {isOpen && !disabled && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
            {SUPPORTED_CHAINS.map((chain) => (
              <button
                key={chain.id}
                onClick={() => {
                  onChainChange(chain.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[var(--app-background)] transition-colors ${
                  chain.id === selectedChainId ? 'bg-[var(--app-accent)]/10 text-[var(--app-accent)]' : 'text-[var(--app-foreground)]'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[var(--app-accent)] to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {chain.symbol.charAt(0)}
                </div>
                <div>
                  <div className="font-medium">{chain.name}</div>
                  <div className="text-xs text-[var(--app-foreground-muted)]">{chain.symbol}</div>
                </div>
                {chain.id === selectedChainId && (
                  <Icon name="check" size="sm" className="ml-auto" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}