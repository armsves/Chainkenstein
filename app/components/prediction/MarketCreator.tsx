"use client";

import { useState } from 'react';
import { Button, Icon } from '../DemoComponents';

interface MarketCreatorProps {
  onCreateMarket: (data: {
    question: string;
    endTime: number;
    initialLiquidity: string;
    civicGated: boolean;
  }) => void;
  isCreating?: boolean;
}

export function MarketCreator({ onCreateMarket, isCreating = false }: MarketCreatorProps) {
  const [question, setQuestion] = useState('');
  const [duration, setDuration] = useState('24'); // hours
  const [initialLiquidity, setInitialLiquidity] = useState('100');
  const [civicGated, setCivicGated] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim() || Number(duration) <= 0 || Number(initialLiquidity) <= 0) {
      return;
    }

    const endTime = Math.floor(Date.now() / 1000) + (Number(duration) * 3600);
    
    onCreateMarket({
      question: question.trim(),
      endTime,
      initialLiquidity,
      civicGated,
    });
  };

  return (
    <div className="bg-[var(--app-card-bg)] backdrop-blur-md rounded-xl shadow-lg border border-[var(--app-card-border)] p-6">
      <div className="flex items-center gap-2 mb-6">
        <Icon name="plus" className="text-[var(--app-accent)]" />
        <h2 className="text-xl font-semibold text-[var(--app-foreground)]">
          Create New Market
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Question */}
        <div>
          <label className="block text-sm font-medium text-[var(--app-foreground)] mb-2">
            Market Question
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--app-background)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none resize-none"
            placeholder="Will ETH be above $3,000 by the end of the week?"
            rows={3}
            maxLength={200}
            required
          />
          <div className="text-xs text-[var(--app-foreground-muted)] mt-1">
            {question.length}/200 characters
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-[var(--app-foreground)] mb-2">
            Duration (hours)
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--app-background)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none"
          >
            <option value="1">1 hour</option>
            <option value="6">6 hours</option>
            <option value="24">24 hours</option>
            <option value="72">3 days</option>
            <option value="168">1 week</option>
          </select>
        </div>

        {/* Initial Liquidity */}
        <div>
          <label className="block text-sm font-medium text-[var(--app-foreground)] mb-2">
            Initial Liquidity (USDC)
          </label>
          <input
            type="number"
            value={initialLiquidity}
            onChange={(e) => setInitialLiquidity(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--app-background)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none"
            placeholder="100"
            min="10"
            step="10"
            required
          />
          <div className="text-xs text-[var(--app-foreground-muted)] mt-1">
            Minimum: 10 USDC
          </div>
        </div>

        {/* Civic Gated Toggle */}
        <div className="flex items-center justify-between p-3 bg-[var(--app-background)] rounded-lg border border-[var(--app-card-border)]">
          <div>
            <div className="flex items-center gap-2">
              <Icon name="check" size="sm" className="text-green-400" />
              <span className="text-sm font-medium text-[var(--app-foreground)]">
                Require KYC Verification
              </span>
            </div>
            <p className="text-xs text-[var(--app-foreground-muted)] mt-1">
              Only verified users can participate
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCivicGated(!civicGated)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              civicGated ? 'bg-green-400' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                civicGated ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isCreating || !question.trim() || Number(initialLiquidity) < 10}
          className="w-full"
        >
          {isCreating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating Market...
            </>
          ) : (
            'Create Market'
          )}
        </Button>
      </form>
    </div>
  );
}