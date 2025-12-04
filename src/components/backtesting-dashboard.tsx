/**
 * Backtesting Dashboard Component
 * Comprehensive UI for running, analyzing, and comparing trading strategy backtests
 * Shows performance metrics, equity curves, trade analysis, and more
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BacktestConfig, BacktestResult, BacktestStrategy } from '@/types/crypto';
import { runBacktest } from '@/lib/backtesting-engine';
import { 
  Play, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  DollarSign, 
  Activity,
  BarChart3,
  PieChart,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function BacktestingDashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  
  // Default backtest configuration
  const [config, setConfig] = useState<BacktestConfig>({
    startDate: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
    endDate: Date.now(),
    initialCapital: 10000,
    coinIds: ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'cardano'],
    strategy: {
      name: 'Momentum Strategy',
      description: 'Follows strong momentum signals with tight risk management',
      entryRules: [],
      exitRules: [],
      stopLossPercent: 3,
      takeProfitPercent: 8,
      minConfidence: 60,
      riskLevels: ['Low', 'Medium', 'High'],
      leverageRange: { min: 2, max: 5 },
    },
    maxPositions: 5,
    positionSize: 20, // % of capital
    leverage: 3,
    includeShorts: true,
  });
  
  const handleRunBacktest = async () => {
    setIsRunning(true);
    try {
      const backtestResult = await runBacktest(config);
      setResult(backtestResult);
    } catch (error) {
      console.error('Backtest error:', error);
    }
    setIsRunning(false);
  };
  
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };
  
  const formatPercent = (num: number) => {
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
  };
  
  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <Card className="bg-gray-900/50 border-gray-800/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-white">Backtest Configuration</CardTitle>
              <p className="text-sm text-gray-400 mt-1">Test trading strategies on historical data</p>
            </div>
            <Button
              onClick={handleRunBacktest}
              disabled={isRunning}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {isRunning ? (
                <>
                  <Activity className="animate-spin mr-2" size={16} />
                  Running...
                </>
              ) : (
                <>
                  <Play className="mr-2" size={16} />
                  Run Backtest
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Initial Capital</label>
              <Input
                type="number"
                value={config.initialCapital}
                onChange={(e) => setConfig({ ...config, initialCapital: Number(e.target.value) })}
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Position Size (%)</label>
              <Input
                type="number"
                value={config.positionSize}
                onChange={(e) => setConfig({ ...config, positionSize: Number(e.target.value) })}
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Leverage</label>
              <Input
                type="number"
                value={config.leverage}
                onChange={(e) => setConfig({ ...config, leverage: Number(e.target.value) })}
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>Strategy:</strong> {config.strategy.name} • 
              <strong>Stop Loss:</strong> {config.strategy.stopLossPercent}% • 
              <strong>Take Profit:</strong> {config.strategy.takeProfitPercent}%
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Results Display */}
      {result && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-900/50 border border-gray-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
            <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gray-900/50 border-gray-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Total Return</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${
                    result.totalReturnPercent > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatPercent(result.totalReturnPercent)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(result.totalReturn)}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900/50 border-gray-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">
                    {result.winRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {result.winningTrades} / {result.totalTrades} wins
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900/50 border-gray-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Final Capital</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">
                    {formatCurrency(result.finalCapital)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Started: {formatCurrency(result.initialCapital)}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900/50 border-gray-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Total Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">
                    {result.totalTrades}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {result.openTrades} still open
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Equity Curve */}
            <Card className="bg-gray-900/50 border-gray-800/50">
              <CardHeader>
                <CardTitle className="text-lg text-white">Equity Curve</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={result.equityCurve}>
                    <defs>
                      <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="timestamp" 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tickFormatter={(ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(ts) => new Date(ts).toLocaleDateString()}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="equity" 
                      stroke="#3B82F6" 
                      fill="url(#equityGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Win/Loss Metrics */}
              <Card className="bg-gray-900/50 border-gray-800/50">
                <CardHeader>
                  <CardTitle className="text-base text-white">Trade Outcomes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Winning Trades</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-400" />
                      <span className="font-bold text-white">{result.winningTrades}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Losing Trades</span>
                    <div className="flex items-center gap-2">
                      <XCircle size={14} className="text-red-400" />
                      <span className="font-bold text-white">{result.losingTrades}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Average Win</span>
                    <span className="font-bold text-green-400">{formatCurrency(result.averageWin)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Average Loss</span>
                    <span className="font-bold text-red-400">{formatCurrency(result.averageLoss)}</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Risk Metrics */}
              <Card className="bg-gray-900/50 border-gray-800/50">
                <CardHeader>
                  <CardTitle className="text-base text-white">Risk Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Max Drawdown</span>
                    <span className="font-bold text-red-400">{formatPercent(-result.maxDrawdown)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Sharpe Ratio</span>
                    <span className="font-bold text-white">{result.sharpeRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Profit Factor</span>
                    <span className="font-bold text-white">{result.profitFactor.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Avg Hold Time</span>
                    <span className="font-bold text-white">{result.averageHoldTime.toFixed(1)}h</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Best/Worst Trades */}
              <Card className="bg-gray-900/50 border-gray-800/50">
                <CardHeader>
                  <CardTitle className="text-base text-white">Extremes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Largest Win</span>
                    <span className="font-bold text-green-400">{formatCurrency(result.largestWin)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Largest Loss</span>
                    <span className="font-bold text-red-400">{formatCurrency(result.largestLoss)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Avg Return/Trade</span>
                    <span className={`font-bold ${
                      result.averageReturn > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(result.averageReturn)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Avg Return %</span>
                    <span className={`font-bold ${
                      result.averageReturnPercent > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatPercent(result.averageReturnPercent)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Trades Tab */}
          <TabsContent value="trades" className="space-y-4">
            <Card className="bg-gray-900/50 border-gray-800/50">
              <CardHeader>
                <CardTitle className="text-lg text-white">Trade History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {result.trades.slice(0, 20).map((trade, idx) => (
                    <div 
                      key={trade.id}
                      className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={
                            trade.type === 'LONG'
                              ? 'bg-green-500/20 text-green-400 border-green-500/50'
                              : 'bg-red-500/20 text-red-400 border-red-500/50'
                          }>
                            {trade.type}
                          </Badge>
                          <span className="font-medium text-white">{trade.coinSymbol}</span>
                          <span className="text-xs text-gray-500">@{trade.entryPrice.toFixed(2)}</span>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            (trade.profitLoss || 0) > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {formatCurrency(trade.profitLoss || 0)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatPercent(trade.profitLossPercent || 0)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Leverage: {trade.leverage}x</span>
                        <span>Exit: {trade.exitReason?.replace('_', ' ')}</span>
                        <span>{new Date(trade.entryDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Risk Analysis Tab */}
          <TabsContent value="risk" className="space-y-6">
            {/* Drawdown Chart */}
            <Card className="bg-gray-900/50 border-gray-800/50">
              <CardHeader>
                <CardTitle className="text-lg text-white">Drawdown Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={result.drawdownCurve}>
                    <defs>
                      <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="timestamp" 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tickFormatter={(ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => `${value.toFixed(2)}%`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="drawdown" 
                      stroke="#EF4444" 
                      fill="url(#drawdownGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Breakdown Tab */}
          <TabsContent value="breakdown" className="space-y-6">
            {/* Performance by Coin */}
            <Card className="bg-gray-900/50 border-gray-800/50">
              <CardHeader>
                <CardTitle className="text-lg text-white">Performance by Cryptocurrency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.performanceByCoin.map((perf) => (
                    <div key={perf.coinId} className="p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{perf.coinSymbol}</span>
                        <span className={`font-bold ${
                          perf.totalReturnPercent > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatPercent(perf.totalReturnPercent)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                        <div>
                          <span className="text-gray-500">Trades:</span> {perf.totalTrades}
                        </div>
                        <div>
                          <span className="text-gray-500">Win Rate:</span> {perf.winRate.toFixed(1)}%
                        </div>
                        <div>
                          <span className="text-gray-500">Avg:</span> {formatCurrency(perf.averageReturn)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      
      {/* Empty State */}
      {!result && !isRunning && (
        <Card className="bg-gray-900/50 border-gray-800/50 backdrop-blur-sm">
          <CardContent className="py-12">
            <div className="text-center">
              <BarChart3 size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Ready to Backtest</h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
                Configure your strategy parameters above and click "Run Backtest" to simulate 
                trading performance on historical data.
              </p>
              <Button
                onClick={handleRunBacktest}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Play className="mr-2" size={16} />
                Run Your First Backtest
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
