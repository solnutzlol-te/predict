/**
 * Technical Indicators Display Panel
 * Shows RSI, MACD, Bollinger Bands, Support/Resistance, and more
 * Provides visual representation of technical analysis
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { fetchPriceHistory } from '@/lib/crypto-api';
import { calculateEnhancedIndicators } from '@/lib/technical-indicators';
import { TrendingUp, TrendingDown, Activity, Target, AlertTriangle, BarChart3, Loader2 } from 'lucide-react';

interface TechnicalIndicatorsPanelProps {
  coinId: string;
  coinName: string;
  coinSymbol: string;
  currentPrice: number;
}

export function TechnicalIndicatorsPanel({
  coinId,
  coinName,
  coinSymbol,
  currentPrice,
}: TechnicalIndicatorsPanelProps) {
  // Fetch price history for indicator calculations
  const { data: priceHistory, isLoading } = useQuery({
    queryKey: ['price-history', coinId, 90],
    queryFn: () => fetchPriceHistory(coinId, 90),
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="text-primary" size={20} />
            Technical Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!priceHistory || priceHistory.prices.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="text-primary" size={20} />
            Technical Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Unable to load technical indicators
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate basic indicators first
  const basicIndicators = {
    trend_24h: 'neutral' as const,
    trend_7d: 'neutral' as const,
    momentum: 0,
    volume_signal: 'normal' as const,
    volatility: 50,
    strength: 50,
  };

  // Calculate enhanced indicators
  const indicators = calculateEnhancedIndicators(priceHistory.prices, basicIndicators);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="text-primary" size={20} />
          Technical Indicators - {coinName} ({coinSymbol.toUpperCase()})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* RSI Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-400" />
              <span className="font-semibold">RSI (14)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{indicators.rsi.value.toFixed(1)}</span>
              <Badge
                className={`${
                  indicators.rsi.signal === 'overbought'
                    ? 'bg-red-500/20 text-red-400 border-red-500/50'
                    : indicators.rsi.signal === 'oversold'
                    ? 'bg-green-500/20 text-green-400 border-green-500/50'
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                }`}
              >
                {indicators.rsi.signal}
              </Badge>
            </div>
          </div>
          <div className="relative w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
              style={{ width: `${indicators.rsi.value}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Oversold (&lt;30)</span>
            <span>Neutral (30-70)</span>
            <span>Overbought (&gt;70)</span>
          </div>
        </div>

        {/* MACD Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-purple-400" />
              <span className="font-semibold">MACD</span>
            </div>
            <Badge
              className={`${
                indicators.macd.trend === 'bullish'
                  ? 'bg-green-500/20 text-green-400 border-green-500/50'
                  : indicators.macd.trend === 'bearish'
                  ? 'bg-red-500/20 text-red-400 border-red-500/50'
                  : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
              }`}
            >
              {indicators.macd.trend}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">MACD Line</div>
              <div className="font-bold">{indicators.macd.macd.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Signal Line</div>
              <div className="font-bold">{indicators.macd.signal.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Histogram</div>
              <div className={`font-bold ${indicators.macd.histogram > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {indicators.macd.histogram.toFixed(2)}
              </div>
            </div>
          </div>
          {indicators.macd.crossover !== 'none' && (
            <div className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <AlertTriangle size={16} className="text-blue-400" />
              <span className="text-sm text-blue-400">
                {indicators.macd.crossover === 'bullish_crossover' ? 'Bullish' : 'Bearish'} crossover detected!
              </span>
            </div>
          )}
        </div>

        {/* Bollinger Bands */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-yellow-400" />
              <span className="font-semibold">Bollinger Bands</span>
            </div>
            <Badge
              className={`${
                indicators.bollingerBands.signal === 'overbought'
                  ? 'bg-red-500/20 text-red-400 border-red-500/50'
                  : indicators.bollingerBands.signal === 'oversold'
                  ? 'bg-green-500/20 text-green-400 border-green-500/50'
                  : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
              }`}
            >
              {indicators.bollingerBands.position.replace('_', ' ')}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Upper Band</div>
              <div className="font-bold">${indicators.bollingerBands.upper.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Middle (SMA)</div>
              <div className="font-bold">${indicators.bollingerBands.middle.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Lower Band</div>
              <div className="font-bold">${indicators.bollingerBands.lower.toFixed(2)}</div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Current Price: <span className="text-foreground font-bold">${currentPrice.toFixed(2)}</span> | Bandwidth:{' '}
            {indicators.bollingerBands.bandwidth.toFixed(2)}%
          </div>
        </div>

        {/* Support & Resistance Levels */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-cyan-400" />
            <span className="font-semibold">Support & Resistance</span>
          </div>

          {/* Resistance Levels */}
          {indicators.resistanceLevels.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Resistance Levels (above current price)</div>
              {indicators.resistanceLevels.map((level, idx) => (
                <div
                  key={`r-${idx}`}
                  className="flex items-center justify-between p-2 bg-red-500/10 border border-red-500/30 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-red-400" />
                    <span className="font-bold text-red-400">${level.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">
                      {level.strength}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{level.touches} touches</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Current Price Line */}
          <div className="flex items-center justify-between p-2 bg-blue-500/10 border border-blue-500/50 rounded-lg">
            <span className="text-sm font-semibold text-blue-400">Current Price</span>
            <span className="font-bold text-blue-400">${currentPrice.toFixed(2)}</span>
          </div>

          {/* Support Levels */}
          {indicators.supportLevels.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Support Levels (below current price)</div>
              {indicators.supportLevels.map((level, idx) => (
                <div
                  key={`s-${idx}`}
                  className="flex items-center justify-between p-2 bg-green-500/10 border border-green-500/30 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <TrendingDown size={14} className="text-green-400" />
                    <span className="font-bold text-green-400">${level.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                      {level.strength}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{level.touches} touches</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Candlestick Pattern */}
        {indicators.candlestickPattern.pattern !== 'none' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-400" />
              <span className="font-semibold">Candlestick Pattern</span>
            </div>
            <div
              className={`p-3 border rounded-lg ${
                indicators.candlestickPattern.signal === 'bullish'
                  ? 'bg-green-500/10 border-green-500/30'
                  : indicators.candlestickPattern.signal === 'bearish'
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-gray-500/10 border-gray-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold capitalize">
                  {indicators.candlestickPattern.pattern.replace(/_/g, ' ')}
                </span>
                <Badge
                  className={`${
                    indicators.candlestickPattern.signal === 'bullish'
                      ? 'bg-green-500/20 text-green-400 border-green-500/50'
                      : indicators.candlestickPattern.signal === 'bearish'
                      ? 'bg-red-500/20 text-red-400 border-red-500/50'
                      : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                  }`}
                >
                  {indicators.candlestickPattern.confidence}% confidence
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{indicators.candlestickPattern.description}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
