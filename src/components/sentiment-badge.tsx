/**
 * Sentiment badge component that displays sentiment score with color coding
 * Shows visual indicator for market sentiment (bullish/bearish/neutral)
 */

import { Badge } from '@/components/ui/badge';
import { SentimentScore } from '@/types/crypto';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SentimentBadgeProps {
  sentiment: SentimentScore;
  size?: 'sm' | 'md' | 'lg';
}

export function SentimentBadge({ sentiment, size = 'md' }: SentimentBadgeProps) {
  const config = {
    EXTREME_BULLISH: {
      label: 'Extreme Bullish',
      color: 'bg-bullish text-bullish-foreground border-bullish',
      icon: TrendingUp,
    },
    BULLISH: {
      label: 'Bullish',
      color: 'bg-bullish/80 text-bullish-foreground border-bullish/80',
      icon: TrendingUp,
    },
    NEUTRAL: {
      label: 'Neutral',
      color: 'bg-neutral/80 text-neutral-foreground border-neutral/80',
      icon: Minus,
    },
    BEARISH: {
      label: 'Bearish',
      color: 'bg-bearish/80 text-bearish-foreground border-bearish/80',
      icon: TrendingDown,
    },
    EXTREME_BEARISH: {
      label: 'Extreme Bearish',
      color: 'bg-bearish text-bearish-foreground border-bearish',
      icon: TrendingDown,
    },
  };

  const { label, color, icon: Icon } = config[sentiment];
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-base px-4 py-2' : 'text-sm px-3 py-1';
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 20 : 16;

  return (
    <Badge className={`${color} ${sizeClass} font-semibold flex items-center gap-1.5 border-2`}>
      <Icon size={iconSize} />
      {label}
    </Badge>
  );
}
