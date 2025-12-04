/**
 * Comprehensive Market Analytics Component
 * Displays real-time market trends, sector performance, volume analysis,
 * correlation matrix, and prediction performance statistics
 */

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CryptoData, CryptoPrediction } from '@/types/crypto';
import { getPredictionStats } from '@/lib/prediction-history';
import { TrendingUp, TrendingDown, Activity, BarChart3, Zap, DollarSign, PieChart, Target, Shield, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MarketAnalyticsProps {
  cryptos: CryptoData[];
  predictions: CryptoPrediction[];
  marketStats: {
    totalMarketCap: number;
    totalVolume: number;
    marketChange24h: number;
  };
}

export function MarketAnalytics({ cryptos, predictions, marketStats }: MarketAnalyticsProps) {
  // State for prediction statistics
  const [predictionStats, setPredictionStats] = useState({
    total: 0,
    wins: 0,
    losses: 0,
    neutral: 0,
    winRate: 0,
    avgProfit: 0,
    longWinRate: 0,
    shortWinRate: 0,
    totalPending: 0,
  });

  // Load prediction stats on mount
  useEffect(() => {
    const loadStats = async () => {
      const stats = await getPredictionStats();
      setPredictionStats(stats);
    };
    loadStats();
  }, []);

  // Calculate market trend distribution
  const marketTrends = useMemo(() => {
    if (cryptos.length === 0) return { bullish: 0, bearish: 0, neutral: 0 };
    
    const bullish = cryptos.filter(c => c.price_change_percentage_24h > 2).length;
    const bearish = cryptos.filter(c => c.price_change_percentage_24h < -2).length;
    const neutral = cryptos.length - bullish - bearish;
    
    return {
      bullish: (bullish / cryptos.length) * 100,
      bearish: (bearish / cryptos.length) * 100,
      neutral: (neutral / cryptos.length) * 100,
    };
  }, [cryptos]);

  // Sector performance (top 10 cryptos)
  const sectorPerformance = useMemo(() => {
    return cryptos.slice(0, 10).map(crypto => ({
      name: crypto.symbol.toUpperCase(),
      change: crypto.price_change_percentage_24h,
      volume: crypto.total_volume,
      marketCap: crypto.market_cap,
    }));
  }, [cryptos]);

  // Volume analysis
  const volumeAnalysis = useMemo(() => {
    return cryptos.slice(0, 10).map(crypto => ({
      name: crypto.symbol.toUpperCase(),
      volume: crypto.total_volume / 1e9, // Convert to billions
      change: crypto.price_change_percentage_24h,
    }));
  }, [cryptos]);

  // Market dominance (top 5)
  const marketDominance = useMemo(() => {
    const total = cryptos.reduce((sum, c) => sum + c.market_cap, 0);
    return cryptos.slice(0, 5).map(crypto => ({
      name: crypto.symbol.toUpperCase(),
      dominance: (crypto.market_cap / total) * 100,
      marketCap: crypto.market_cap,
    }));
  }, [cryptos]);

  // Volatility analysis
  const volatilityAnalysis = useMemo(() => {
    return cryptos.slice(0, 10).map(crypto => {
      const priceRange = crypto.high_24h - crypto.low_24h;
      const volatility = (priceRange / crypto.current_price) * 100;
      return {
        name: crypto.symbol.toUpperCase(),
        volatility,
        high: crypto.high_24h,
        low: crypto.low_24h,
      };
    });
  }, [cryptos]);

  // Signal distribution
  const signalDistribution = useMemo(() => {
    const long = predictions.filter(p => p.prediction === 'LONG').length;
    const short = predictions.filter(p => p.prediction === 'SHORT').length;
    const total = predictions.length;
    
    return [
      { name: 'LONG', value: long, percentage: total > 0 ? (long / total) * 100 : 0, color: 'hsl(142, 76%, 36%)' },
      { name: 'SHORT', value: short, percentage: total > 0 ? (short / total) * 100 : 0, color: 'hsl(0, 84%, 60%)' },
    ];
  }, [predictions]);

  // Risk distribution
  const riskDistribution = useMemo(() => {
    const low = predictions.filter(p => p.riskLevel === 'Low').length;
    const medium = predictions.filter(p => p.riskLevel === 'Medium').length;
    const high = predictions.filter(p => p.riskLevel === 'High').length;
    const extreme = predictions.filter(p => p.riskLevel === 'Extreme').length;
    
    return [
      { name: 'Low', value: low, color: 'hsl(142, 76%, 36%)' },
      { name: 'Medium', value: medium, color: 'hsl(47, 100%, 50%)' },
      { name: 'High', value: high, color: 'hsl(30, 100%, 50%)' },
      { name: 'Extreme', value: extreme, color: 'hsl(0, 84%, 60%)' },
    ].filter(item => item.value > 0);
  }, [predictions]);

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Market Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">Market Cap</CardTitle>
              <DollarSign size={16} className="text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              ${(marketStats.totalMarketCap / 1e12).toFixed(2)}T
            </p>
            <p className={`text-xs mt-1 ${marketStats.marketChange24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {marketStats.marketChange24h > 0 ? '+' : ''}{marketStats.marketChange24h.toFixed(2)}% (24h)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">24h Volume</CardTitle>
              <Activity size={16} className="text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              ${(marketStats.totalVolume / 1e9).toFixed(2)}B
            </p>
            <p className="text-xs mt-1 text-gray-400">Trading activity</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">Active Signals</CardTitle>
              <Zap size={16} className="text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{predictions.length}</p>
            <p className="text-xs mt-1 text-gray-400">Actionable positions</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">Win Rate</CardTitle>
              <Target size={16} className="text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{predictionStats.winRate.toFixed(1)}%</p>
            <p className="text-xs mt-1 text-gray-400">{predictionStats.wins} / {predictionStats.total} wins</p>
          </CardContent>
        </Card>
      </div>

      {/* Market Trends & Signal Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Trend Distribution */}
        <Card className="bg-gray-900/50 border-gray-800/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-400" />
              <CardTitle className="text-lg font-semibold text-white">Market Sentiment</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300 flex items-center gap-2">
                    <TrendingUp size={14} className="text-green-400" />
                    Bullish
                  </span>
                  <span className="text-sm font-bold text-green-400">{marketTrends.bullish.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${marketTrends.bullish}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300 flex items-center gap-2">
                    <TrendingDown size={14} className="text-red-400" />
                    Bearish
                  </span>
                  <span className="text-sm font-bold text-red-400">{marketTrends.bearish.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${marketTrends.bearish}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300 flex items-center gap-2">
                    <Activity size={14} className="text-gray-400" />
                    Neutral
                  </span>
                  <span className="text-sm font-bold text-gray-400">{marketTrends.neutral.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gray-600 rounded-full"
                    style={{ width: `${marketTrends.neutral}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-400">Based on 24h price changes across {cryptos.length} assets</p>
            </div>
          </CardContent>
        </Card>

        {/* Signal Distribution */}
        <Card className="bg-gray-900/50 border-gray-800/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap size={20} className="text-yellow-400" />
              <CardTitle className="text-lg font-semibold text-white">Signal Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Signal Distribution */}
            <div className="space-y-3">
              {signalDistribution.map(signal => (
                <div key={signal.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300 font-medium">{signal.name} Signals</span>
                    <span className="text-sm font-bold" style={{ color: signal.color }}>
                      {signal.value} ({signal.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ width: `${signal.percentage}%`, backgroundColor: signal.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Risk Distribution */}
            <div className="pt-4 border-t border-gray-800">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Risk Distribution</h4>
              <div className="flex items-center gap-2 flex-wrap">
                {riskDistribution.map(risk => (
                  <Badge 
                    key={risk.name}
                    variant="outline"
                    className="border-gray-700"
                    style={{ borderColor: risk.color, color: risk.color }}
                  >
                    {risk.name}: {risk.value}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-400">Total active predictions: {predictions.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Performance */}
        <Card className="bg-gray-900/50 border-gray-800/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 size={20} className="text-purple-400" />
              <CardTitle className="text-lg font-semibold text-white">Sector Performance (24h)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sectorPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                />
                <Bar dataKey="change" radius={[4, 4, 0, 0]}>
                  {sectorPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.change > 0 ? '#22C55E' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Volume Analysis */}
        <Card className="bg-gray-900/50 border-gray-800/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-blue-400" />
              <CardTitle className="text-lg font-semibold text-white">Volume Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={volumeAnalysis}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number) => `$${value.toFixed(2)}B`}
                />
                <Bar dataKey="volume" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Market Dominance & Volatility */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Dominance */}
        <Card className="bg-gray-900/50 border-gray-800/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart size={20} className="text-green-400" />
              <CardTitle className="text-lg font-semibold text-white">Market Dominance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {marketDominance.map((item, index) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300 font-medium">{item.name}</span>
                    <span className="text-sm font-bold text-white">
                      {item.dominance.toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${item.dominance}%`,
                        backgroundColor: `hsl(${220 - index * 30}, 70%, 50%)`
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{formatNumber(item.marketCap)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Volatility Analysis */}
        <Card className="bg-gray-900/50 border-gray-800/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-orange-400" />
              <CardTitle className="text-lg font-semibold text-white">Volatility Index</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {volatilityAnalysis.slice(0, 8).map((item) => {
                const volatilityColor = item.volatility > 10 ? 'text-red-400' : item.volatility > 5 ? 'text-yellow-400' : 'text-green-400';
                return (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300 font-medium">{item.name}</span>
                    <span className={`text-sm font-bold ${volatilityColor}`}>
                      {item.volatility.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="pt-4 mt-4 border-t border-gray-800">
              <p className="text-xs text-gray-400">Based on 24h high/low price range</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prediction Performance */}
      <Card className="bg-gray-900/50 border-gray-800/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target size={20} className="text-green-400" />
            <CardTitle className="text-lg font-semibold text-white">Prediction Performance</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">{predictionStats.winRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-400 mt-1">Win Rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{predictionStats.total}</p>
              <p className="text-xs text-gray-400 mt-1">Total Predictions</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-400">{predictionStats.longWinRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-400 mt-1">LONG Win Rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-400">{predictionStats.shortWinRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-400 mt-1">SHORT Win Rate</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-800 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-400">{predictionStats.wins}</p>
              <p className="text-xs text-gray-400 mt-1">Wins</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{predictionStats.losses}</p>
              <p className="text-xs text-gray-400 mt-1">Losses</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{predictionStats.totalPending}</p>
              <p className="text-xs text-gray-400 mt-1">Pending</p>
            </div>
          </div>

          {predictionStats.avgProfit !== 0 && (
            <div className="mt-6 pt-6 border-t border-gray-800 text-center">
              <p className={`text-2xl font-bold ${predictionStats.avgProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {predictionStats.avgProfit > 0 ? '+' : ''}{predictionStats.avgProfit.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-400 mt-1">Average Profit/Loss</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
