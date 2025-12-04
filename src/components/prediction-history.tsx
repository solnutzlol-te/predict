/**
 * Prediction history component
 * Displays past predictions and their accuracy metrics
 * Helps users track the performance of AI predictions over time
 */

import { useEffect, useState } from 'react';
import { getRecentPredictions, getPredictionStats } from '@/lib/prediction-history';
import { PredictionHistoryEntry } from '@/types/crypto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Target, Clock, Award, BarChart3, RefreshCw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export function PredictionHistory() {
  const [history, setHistory] = useState<PredictionHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
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

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      // Fetch history from API (async)
      const historyData = await getRecentPredictions(7);
      setHistory(historyData);
      console.log('[PredictionHistory] Loaded history:', historyData.length, 'entries');
      
      // Fetch stats from API (async)
      const statsData = await getPredictionStats();
      setStats(statsData);
      console.log('[PredictionHistory] Loaded stats:', statsData);
    } catch (error) {
      console.error('[PredictionHistory] Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const renderOutcomeBadge = (outcome: string) => {
    if (outcome === 'win') {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
          <Award size={12} className="mr-1" />
          Win
        </Badge>
      );
    }
    if (outcome === 'loss') {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
          <TrendingDown size={12} className="mr-1" />
          Loss
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-gray-600 text-gray-400">
        <Clock size={12} className="mr-1" />
        Pending
      </Badge>
    );
  };

  const renderPredictionType = (type: string) => {
    if (type === 'LONG') {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
          <TrendingUp size={12} className="mr-1" />
          LONG
        </Badge>
      );
    }
    if (type === 'SHORT') {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
          <TrendingDown size={12} className="mr-1" />
          SHORT
        </Badge>
      );
    }
    return <Badge variant="outline" className="border-gray-600 text-gray-400">NEUTRAL</Badge>;
  };

  return (
    <Card className="border-gray-800/50 bg-gray-900/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-white" size={20} />
            <CardTitle className="text-lg text-white">Prediction Performance</CardTitle>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={loadHistory} 
            disabled={isLoading}
            className="border-gray-700 bg-gray-800/50 hover:bg-gray-700 text-white"
          >
            {isLoading ? (
              <Loader2 size={14} className="mr-1 animate-spin" />
            ) : (
              <RefreshCw size={14} className="mr-1" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 border-gray-700">
            <TabsTrigger value="stats" className="data-[state=active]:bg-gray-700 text-gray-300 data-[state=active]:text-white">Statistics</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gray-700 text-gray-300 data-[state=active]:text-white">History</TabsTrigger>
          </TabsList>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={32} className="animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-1">Total Predictions</p>
                    <p className="text-2xl font-bold text-white">{stats.total + stats.totalPending}</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-1">Win Rate</p>
                    <p className="text-2xl font-bold text-green-400">{stats.winRate.toFixed(1)}%</p>
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-1">Wins / Losses</p>
                    <p className="text-2xl font-bold">
                      <span className="text-green-400">{stats.wins}</span>
                      {' / '}
                      <span className="text-red-400">{stats.losses}</span>
                    </p>
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-1">Avg Profit/Loss</p>
                    <p className={`text-2xl font-bold ${stats.avgProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stats.avgProfit >= 0 ? '+' : ''}{stats.avgProfit.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-2">LONG Predictions</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold text-white">Win Rate</p>
                      <p className="text-xl font-bold text-green-400">{stats.longWinRate.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-2">SHORT Predictions</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold text-white">Win Rate</p>
                      <p className="text-xl font-bold text-red-400">{stats.shortWinRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                {stats.total === 0 && stats.totalPending === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Target size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No prediction history yet.</p>
                    <p className="text-xs mt-1">Predictions will be automatically tracked as you use the platform.</p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={32} className="animate-spin text-gray-400" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Clock size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">No prediction history available.</p>
                <p className="text-xs mt-1 text-gray-500">
                  Predictions are automatically saved when you generate signals.
                  <br />
                  Come back later to see your prediction performance!
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-white">
                          {entry.coinName} ({entry.coinSymbol.toUpperCase()})
                        </h4>
                        <p className="text-xs text-gray-400">
                          {format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {renderPredictionType(entry.prediction)}
                        {renderOutcomeBadge(entry.outcome)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <p className="text-gray-400">Entry Price</p>
                        <p className="font-semibold text-white">${entry.predictedPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Target</p>
                        <p className="font-semibold text-green-400">${entry.targetPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Stop Loss</p>
                        <p className="font-semibold text-red-400">${entry.stopLoss.toFixed(2)}</p>
                      </div>
                      {entry.profitLoss !== null && (
                        <div>
                          <p className="text-gray-400">P/L</p>
                          <p className={`font-semibold ${entry.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {entry.profitLoss >= 0 ? '+' : ''}{entry.profitLoss.toFixed(2)}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
