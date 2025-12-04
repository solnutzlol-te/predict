/**
 * Modern minimalist prediction card component
 * Clean, professional design with flat colors and crisp typography
 * No heavy shadows or gradients - just pure, elegant UI
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CryptoPrediction } from '@/types/crypto';
import { SentimentBadge } from './sentiment-badge';
import { getAvailablePlatforms } from '@/lib/trading-platforms';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  AlertTriangle,
  Clock,
  Activity,
  BarChart3,
  Zap,
  Shield,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

interface PredictionCardProps {
  prediction: CryptoPrediction;
}

export function PredictionCard({ prediction }: PredictionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { 
    crypto, 
    prediction: type, 
    confidence, 
    reasons, 
    targetPrice, 
    stopLoss, 
    timeframe, 
    analysis,
    leverage,
    riskLevel
  } = prediction;

  const predictionConfig = {
    LONG: {
      label: 'LONG',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      icon: TrendingUp,
    },
    SHORT: {
      label: 'SHORT',
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      icon: TrendingDown,
    },
    NEUTRAL: {
      label: 'NEUTRAL',
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/10',
      icon: Minus,
    },
  };

  const riskConfig = {
    Low: { 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10'
    },
    Medium: { 
      color: 'text-yellow-400', 
      bg: 'bg-yellow-500/10'
    },
    High: { 
      color: 'text-orange-400', 
      bg: 'bg-orange-500/10'
    },
    Extreme: { 
      color: 'text-rose-400', 
      bg: 'bg-rose-500/10'
    },
  };

  const config = predictionConfig[type];
  const risk = riskConfig[riskLevel];
  const priceChange24h = crypto.price_change_percentage_24h;
  const isPositive = priceChange24h > 0;

  // Get available trading platforms for this crypto
  const availablePlatforms = getAvailablePlatforms(crypto.symbol);

  // Calculate leverage styling
  const getLeverageColor = (lev: number) => {
    if (lev <= 3) return 'text-emerald-400';
    if (lev <= 5) return 'text-blue-400';
    if (lev <= 7) return 'text-amber-400';
    return 'text-orange-400';
  };

  const getLeverageBg = (lev: number) => {
    if (lev <= 3) return 'bg-emerald-500/10';
    if (lev <= 5) return 'bg-blue-500/10';
    if (lev <= 7) return 'bg-amber-500/10';
    return 'bg-orange-500/10';
  };

  return (
    <Card className="bg-[#0A0E27] border-white/5 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img src={crypto.image} alt={crypto.name} className="w-11 h-11 rounded-full ring-1 ring-white/10" />
            <div>
              <CardTitle className="text-lg font-semibold text-white/95">{crypto.name}</CardTitle>
              <p className="text-xs text-white/40 uppercase tracking-wider font-medium mt-0.5">{crypto.symbol}</p>
            </div>
          </div>
          
          {/* Modern LONG/SHORT Badge - Flat Design */}
          <div className={`${config.bgColor} rounded-md px-3 py-1.5 flex items-center gap-1.5`}>
            <config.icon className={config.color} size={16} strokeWidth={2.5} />
            <span className={`text-sm font-bold tracking-wide ${config.color}`}>{config.label}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price Information */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-white/95 tracking-tight">${crypto.current_price.toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? '+' : ''}{priceChange24h.toFixed(2)}%
              </span>
              <span className="text-xs text-white/30">24h</span>
            </div>
          </div>
        </div>

        {/* Compact Professional Boxes - Minimal Color */}
        <div className="grid grid-cols-3 gap-3">
          {/* Leverage Box - Minimal Professional Design */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium tracking-wider text-white/40 uppercase">Leverage</span>
              <Zap size={12} className="text-white/30" strokeWidth={2} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white/90 tracking-tight">{leverage}</span>
              <span className="text-lg font-semibold text-white/50">×</span>
            </div>
          </div>

          {/* Risk Level Box - Minimal Professional Design */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium tracking-wider text-white/40 uppercase">Risk</span>
              <Shield size={12} className="text-white/30" strokeWidth={2} />
            </div>
            <span className={`text-lg font-bold tracking-tight ${risk.color}`}>
              {riskLevel}
            </span>
          </div>

          {/* Timeframe Box - Minimal Professional Design */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium tracking-wider text-white/40 uppercase">Timeframe</span>
              <Clock size={12} className="text-white/30" strokeWidth={2} />
            </div>
            <span className="text-sm font-bold text-white/90 leading-tight">
              {timeframe}
            </span>
          </div>
        </div>

        {/* Trading Platform Buttons - Moved after the boxes for better layout */}
        {availablePlatforms.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-medium tracking-wider text-white/40 uppercase">Trade On</p>
            <div className="flex flex-wrap gap-2">
              {availablePlatforms.map((platform) => (
                <a
                  key={platform.id}
                  href={platform.generateUrl(crypto.symbol)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all"
                >
                  <img 
                    src={platform.logo} 
                    alt={platform.name}
                    className="w-4 h-4 object-contain"
                    onError={(e) => {
                      // Fallback if logo fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="text-xs font-semibold text-white/70 group-hover:text-white/90">
                    {platform.name}
                  </span>
                  <ExternalLink size={12} className="text-white/40 group-hover:text-white/60" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Clean Analysis Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-white/5 hover:bg-white/10 rounded-lg py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-white/70 hover:text-white/90 transition-all"
        >
          {isExpanded ? (
            <>
              <ChevronUp size={16} strokeWidth={2.5} />
              Hide Analysis
            </>
          ) : (
            <>
              <ChevronDown size={16} strokeWidth={2.5} />
              Analysis
            </>
          )}
        </button>

        {/* Collapsible Details */}
        {isExpanded && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            {/* Sentiment & Confidence */}
            <div className="flex items-center justify-between">
              <SentimentBadge sentiment={prediction.sentiment} size="md" />
              <p className="text-sm text-white/40">Confidence: <span className="font-semibold text-white/80">{confidence}%</span></p>
            </div>

            {/* Analysis */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
              <p className="text-sm leading-relaxed text-white/60">{analysis}</p>
            </div>

            {/* Targets */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target size={12} className="text-white/40" strokeWidth={2.5} />
                  <p className="text-[10px] text-white/40 font-semibold tracking-wider uppercase">Target</p>
                </div>
                <p className="text-sm font-bold text-white/90">${targetPrice.toLocaleString()}</p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  {type === 'LONG' ? '+' : type === 'SHORT' ? '-' : ''}
                  {Math.abs(((targetPrice - crypto.current_price) / crypto.current_price) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle size={12} className="text-white/40" strokeWidth={2.5} />
                  <p className="text-[10px] text-white/40 font-semibold tracking-wider uppercase">Stop Loss</p>
                </div>
                <p className="text-sm font-bold text-white/90">${stopLoss.toLocaleString()}</p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  {type === 'SHORT' ? '+' : '-'}
                  {Math.abs(((stopLoss - crypto.current_price) / crypto.current_price) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock size={12} className="text-white/40" strokeWidth={2.5} />
                  <p className="text-[10px] text-white/40 font-semibold tracking-wider uppercase">Timeframe</p>
                </div>
                <p className="text-xs font-bold leading-tight text-white/90">{timeframe}</p>
              </div>
            </div>

            {/* Technical Indicators */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-white/40" strokeWidth={2.5} />
                <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Technical Indicators</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 border border-white/5 rounded p-2.5">
                  <p className="text-[10px] text-white/40 font-medium">Momentum</p>
                  <p className="text-sm font-bold text-white/90 mt-0.5">{prediction.indicators.momentum.toFixed(1)}</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded p-2.5">
                  <p className="text-[10px] text-white/40 font-medium">Strength</p>
                  <p className="text-sm font-bold text-white/90 mt-0.5">{prediction.indicators.strength.toFixed(0)}/100</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded p-2.5">
                  <p className="text-[10px] text-white/40 font-medium">Volatility</p>
                  <p className="text-sm font-bold text-white/90 mt-0.5">{prediction.indicators.volatility.toFixed(1)}%</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded p-2.5">
                  <p className="text-[10px] text-white/40 font-medium">Volume</p>
                  <p className="text-sm font-bold capitalize text-white/90 mt-0.5">{prediction.indicators.volume_signal}</p>
                </div>
              </div>
            </div>

            {/* Reasons */}
            {reasons.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BarChart3 size={14} className="text-white/40" strokeWidth={2.5} />
                  <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Key Factors</p>
                </div>
                <div className="space-y-2">
                  {reasons.map((reason, index) => (
                    <div key={index} className="flex items-start gap-2.5 bg-white/5 border border-white/5 rounded p-2.5">
                      <div
                        className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${
                          reason.impact === 'positive'
                            ? 'bg-emerald-400'
                            : reason.impact === 'negative'
                            ? 'bg-rose-400'
                            : 'bg-gray-400'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white/80">{reason.category}</p>
                        <p className="text-xs text-white/50 leading-relaxed mt-0.5">{reason.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Market Info */}
            <div className="flex items-center justify-between text-[11px] text-white/30 pt-2 border-t border-white/5">
              <span>Market Cap: ${(crypto.market_cap / 1e9).toFixed(2)}B</span>
              <span>Volume: ${(crypto.total_volume / 1e9).toFixed(2)}B</span>
              <span>Rank #{crypto.market_cap_rank}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
