/**
 * Crypto Prediction Hub - Main Application Interface
 * 
 * This page displays real-time cryptocurrency predictions with AI-powered analysis.
 * Features:
 * - Live price data from CoinGecko API
 * - Technical analysis with Long/Short signals ONLY (no neutral)
 * - Detailed reasoning and sentiment scoring
 * - Market overview with global statistics
 * - Auto-refresh every 30 seconds
 * - Search functionality to add any cryptocurrency
 * - Interactive price charts with multiple timeframes
 * - Prediction history and performance tracking with automatic evaluation
 * - Watchlist management for favorite cryptocurrencies
 * - Portfolio tracking with real-time P/L
 * - Analytics dashboard with market trends
 * - Advanced filters & sorting for predictions
 * - News feed with sentiment analysis
 * - Dark/Light mode toggle
 */

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTopCryptos, fetchGlobalMarketData, searchCryptos, fetchCryptoById, CryptoSearchResult } from '@/lib/crypto-api';
import { generatePredictions } from '@/lib/prediction-engine';
import { recordPrediction, evaluatePendingPredictions } from '@/lib/prediction-history';
import { NavigationHeader } from '@/components/navigation-header';
import { PredictionCard } from '@/components/prediction-card';
import { MarketOverview } from '@/components/market-overview';
import { CryptoSearch } from '@/components/crypto-search';
import { PriceChart } from '@/components/price-chart';
import { PredictionHistory } from '@/components/prediction-history';
import { WatchlistManager } from '@/components/watchlist-manager';
import { MarketAnalytics } from '@/components/market-analytics';
import { PortfolioTracker } from '@/components/portfolio-tracker';
import { PredictionFiltersComponent } from '@/components/prediction-filters';

import { TechnicalIndicatorsPanel } from '@/components/technical-indicators-panel';
import { BacktestingDashboard } from '@/components/backtesting-dashboard';
import { fetchPriceHistory } from '@/lib/crypto-api';
import { calculateEnhancedIndicators } from '@/lib/technical-indicators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { RefreshCw, TrendingUp, Sparkles, Activity, Search, BarChart3, Star, Clock, AlertCircle, Zap, Plus, X, Loader2, PieChart, LineChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CryptoData, PredictionFilters, PredictionSortOption, CryptoPrediction } from '@/types/crypto';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const FILTERS_STORAGE_KEY = 'monfutures-filters';
const SORT_STORAGE_KEY = 'monfutures-sort';

export default function Home() {
  // State for active tab
  const [activeTab, setActiveTab] = useState('predictions');
  
  // State for custom added cryptocurrencies
  const [customCryptos, setCustomCryptos] = useState<CryptoData[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [justUpdated, setJustUpdated] = useState(false);
  const [historyKey, setHistoryKey] = useState(0); // Key to force history component refresh
  
  // Chart search state
  const [chartSearchQuery, setChartSearchQuery] = useState('');
  const [isChartSearchOpen, setIsChartSearchOpen] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);

  // Filter and sort state
  const [filters, setFilters] = useState<PredictionFilters>(() => {
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved filters:', e);
      }
    }
    return {
      riskLevels: [],
      leverageRange: null,
      timeframes: [],
      predictionTypes: ['LONG', 'SHORT'],
    };
  });

  const [sortBy, setSortBy] = useState<PredictionSortOption>(() => {
    const saved = localStorage.getItem(SORT_STORAGE_KEY);
    return (saved as PredictionSortOption) || 'confidence-desc';
  });

  // Save filters and sort to localStorage
  useEffect(() => {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    localStorage.setItem(SORT_STORAGE_KEY, sortBy);
  }, [sortBy]);

  // Fetch top cryptocurrencies with 30-second auto-refresh
  const cryptoQuery = useQuery({
    queryKey: ['top-cryptos'],
    queryFn: () => fetchTopCryptos(24), // Fetch 24 major cryptocurrencies for more coverage
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 20000,
  });

  // Fetch global market data
  const marketQuery = useQuery({
    queryKey: ['global-market'],
    queryFn: fetchGlobalMarketData,
    refetchInterval: 60000,
    staleTime: 50000,
  });

  // Search cryptocurrencies for charts
  const chartSearchQueryData = useQuery({
    queryKey: ['chart-search', chartSearchQuery],
    queryFn: () => searchCryptos(chartSearchQuery),
    enabled: chartSearchQuery.length > 0,
    staleTime: 60000,
  });

  // Combine top cryptos and custom added cryptos
  const allCryptos = [...(cryptoQuery.data || []), ...customCryptos];

  // Generate predictions from crypto data using React Query (async)
  const predictionsQuery = useQuery({
    queryKey: ['predictions', allCryptos.map(c => c.id).join(',')],
    queryFn: () => generatePredictions(allCryptos),
    enabled: allCryptos.length > 0,
    staleTime: 25000, // Cache predictions for 25 seconds
    refetchInterval: 30000, // Refresh predictions every 30 seconds
  });

  // Get all predictions from query
  const allPredictions = predictionsQuery.data || [];

  // Filter to only show LONG and SHORT predictions (no NEUTRAL)
  const actionablePredictions = allPredictions.filter(p => p.prediction !== 'NEUTRAL');

  // Apply filters and sorting
  const filteredAndSortedPredictions = useMemo(() => {
    let result = [...actionablePredictions];

    // Apply prediction type filter
    if (filters.predictionTypes.length < 2) {
      result = result.filter(p => filters.predictionTypes.includes(p.prediction));
    }

    // Apply risk level filter
    if (filters.riskLevels.length > 0) {
      result = result.filter(p => filters.riskLevels.includes(p.riskLevel));
    }

    // Apply leverage range filter
    if (filters.leverageRange !== null) {
      result = result.filter(p => 
        p.leverage >= filters.leverageRange!.min && 
        p.leverage <= filters.leverageRange!.max
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'confidence-desc':
        result.sort((a, b) => b.confidence - a.confidence);
        break;
      case 'confidence-asc':
        result.sort((a, b) => a.confidence - b.confidence);
        break;
      case 'price-change-desc':
        result.sort((a, b) => Math.abs(b.crypto.price_change_percentage_24h) - Math.abs(a.crypto.price_change_percentage_24h));
        break;
      case 'price-change-asc':
        result.sort((a, b) => Math.abs(a.crypto.price_change_percentage_24h) - Math.abs(b.crypto.price_change_percentage_24h));
        break;
      case 'market-cap-desc':
        result.sort((a, b) => b.crypto.market_cap - a.crypto.market_cap);
        break;
      case 'market-cap-asc':
        result.sort((a, b) => a.crypto.market_cap - b.crypto.market_cap);
        break;
      case 'volume-desc':
        result.sort((a, b) => b.crypto.total_volume - a.crypto.total_volume);
        break;
      case 'volume-asc':
        result.sort((a, b) => a.crypto.total_volume - b.crypto.total_volume);
        break;
    }

    return result;
  }, [actionablePredictions, filters, sortBy]);

  // Update timestamp when data changes
  useEffect(() => {
    if (cryptoQuery.data && predictionsQuery.data) {
      setLastUpdate(new Date());
      setJustUpdated(true);
      
      // Remove the flash effect after 2 seconds
      const timer = setTimeout(() => {
        setJustUpdated(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [cryptoQuery.dataUpdatedAt, predictionsQuery.dataUpdatedAt]);

  // Record predictions to history (only once when data changes)
  useEffect(() => {
    if (actionablePredictions.length > 0) {
      actionablePredictions.forEach(prediction => {
        recordPrediction(prediction);
      });
    }
  }, [cryptoQuery.data?.length]); // Only trigger when crypto data changes

  // Evaluate pending predictions whenever price data updates
  useEffect(() => {
    if (allCryptos.length > 0) {
      // Create a map of coin ID to current price
      const priceMap = new Map<string, number>();
      allCryptos.forEach(crypto => {
        priceMap.set(crypto.id, crypto.current_price);
      });
      
      // Evaluate all pending predictions
      evaluatePendingPredictions(priceMap);
      
      // Force history component to refresh
      setHistoryKey(prev => prev + 1);
    }
  }, [allCryptos.map(c => `${c.id}:${c.current_price}`).join(',')]); // Trigger when any price changes

  // Auto-select first crypto for chart
  useEffect(() => {
    if (allCryptos.length > 0 && !selectedCrypto) {
      setSelectedCrypto(allCryptos[0]);
    }
  }, [allCryptos.length]);

  // Calculate market stats
  const marketStats = marketQuery.data
    ? {
        totalMarketCap: marketQuery.data.total_market_cap?.usd || 0,
        totalVolume: marketQuery.data.total_volume?.usd || 0,
        marketChange24h: marketQuery.data.market_cap_change_percentage_24h_usd || 0,
        activeCryptos: marketQuery.data.active_cryptocurrencies || 0,
      }
    : {
        totalMarketCap: 0,
        totalVolume: 0,
        marketChange24h: 0,
        activeCryptos: 0,
      };

  const handleRefresh = () => {
    cryptoQuery.refetch();
    marketQuery.refetch();
    predictionsQuery.refetch();
    toast.info('Refreshing data...', {
      description: 'Fetching latest prices and predictions',
    });
  };

  const handleAddCrypto = (crypto: CryptoData) => {
    // Check if stablecoin
    if (!crypto) {
      toast.error('Cannot add stablecoins', {
        description: 'Stablecoins are not suitable for trading predictions.',
      });
      return;
    }

    // Check if already exists
    const exists = allCryptos.some((c) => c.id === crypto.id);
    if (exists) {
      toast.error('Already added', {
        description: `${crypto.name} is already in your watchlist.`,
      });
      return;
    }

    setCustomCryptos((prev) => [...prev, crypto]);
    toast.success('Added successfully', {
      description: `${crypto.name} (${crypto.symbol.toUpperCase()}) will show if it has a clear signal.`,
    });
  };

  // Handle chart search
  const handleChartSearchChange = (value: string) => {
    setChartSearchQuery(value);
    if (value.length > 0) {
      setIsChartSearchOpen(true);
    } else {
      setIsChartSearchOpen(false);
    }
  };

  const handleChartSearchClose = () => {
    setIsChartSearchOpen(false);
    setChartSearchQuery('');
  };

  const handleSelectChartCoin = async (coin: CryptoSearchResult) => {
    setIsChartLoading(true);
    
    try {
      // Fetch full coin data
      const coinData = await fetchCryptoById(coin.id);
      
      if (!coinData) {
        toast.error('Cannot chart this coin', {
          description: 'This coin is filtered or unavailable.',
        });
        setIsChartLoading(false);
        return;
      }

      // Set as selected crypto for chart
      setSelectedCrypto(coinData);

      toast.success('Chart loaded', {
        description: `Now showing chart for ${coin.name}`,
      });

      // Reset search
      setChartSearchQuery('');
      setIsChartSearchOpen(false);
    } catch (error) {
      console.error('Error loading chart:', error);
      toast.error('Failed to load chart', {
        description: 'Please try again or check your internet connection.',
      });
    } finally {
      setIsChartLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      riskLevels: [],
      leverageRange: null,
      timeframes: [],
      predictionTypes: ['LONG', 'SHORT'],
    });
    toast.success('Filters cleared');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden transition-colors duration-300">
      {/* Navigation Header */}
      <NavigationHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Subtle particle effects background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-1 h-1 bg-primary/40 rounded-full animate-pulse" />
        <div className="absolute top-40 right-32 w-1 h-1 bg-primary/30 rounded-full" />
        <div className="absolute bottom-32 left-1/3 w-1 h-1 bg-blue-400 rounded-full opacity-50 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-purple-400 rounded-full opacity-40" />
        <div className="absolute bottom-40 right-20 w-1 h-1 bg-primary/35 rounded-full animate-pulse" />
      </div>

      {/* Premium Hero Header */}
      <header className="relative pt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20 pb-24">
          <div className="max-w-4xl">
            {/* Main title */}
            <h1 className="text-6xl md:text-7xl font-bold text-foreground tracking-tighter leading-none mb-6">
              YOUR GATEWAY
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-blue-500 bg-clip-text text-transparent">
                TO CRYPTO ALPHA
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl font-light mb-10">
              Our engine delivers peak efficiency, high reliability and seamless performance—even under heavy market volatility.
            </p>

          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 lg:px-12 pb-20 space-y-10">
        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="hidden">
            {/* Hidden - navigation is in header */}
          </TabsList>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-8">
            {/* Search Section */}
            <div className="bg-card border border-border rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <Search className="text-blue-400" size={20} />
                <h3 className="text-lg font-semibold text-foreground">
                  Discover Assets
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4 font-light">
                Search and track any cryptocurrency — signals appear when market conditions align
              </p>
              <CryptoSearch
                onAddCrypto={handleAddCrypto}
                existingCryptoIds={allCryptos.map((c) => c.id)}
              />
            </div>

            {/* Market Overview */}
            {marketQuery.data && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Activity size={20} className="text-blue-400" />
                  Global Market Pulse
                </h3>
                <MarketOverview stats={marketStats} />
              </div>
            )}

            {/* Filters & Sorting */}
            <PredictionFiltersComponent
              filters={filters}
              sortBy={sortBy}
              onFiltersChange={setFilters}
              onSortChange={setSortBy}
              onClearFilters={handleClearFilters}
              resultCount={filteredAndSortedPredictions.length}
            />

            {/* Predictions Grid */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg border border-green-500/30">
                    <TrendingUp size={20} className="text-green-400" />
                  </div>
                  Active Positions
                  <Badge variant="outline" className="ml-2 border-green-500/30 text-green-400 font-bold">
                    {filteredAndSortedPredictions.length} signals
                  </Badge>
                  {customCryptos.length > 0 && (
                    <Badge variant="outline" className="border-blue-500/30 text-blue-400 font-bold">
                      {customCryptos.length} tracked
                    </Badge>
                  )}
                </h3>
              </div>

              {(cryptoQuery.isLoading || predictionsQuery.isLoading) ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-[600px] bg-card border border-border rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              ) : (cryptoQuery.error || predictionsQuery.error) ? (
                <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-8 text-center">
                  <p className="text-red-400 font-semibold mb-2">Failed to load data</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Unable to fetch cryptocurrency data. Please check your connection and try again.
                  </p>
                  <Button onClick={handleRefresh} variant="outline" size="sm" className="border-border bg-card">
                    <RefreshCw size={16} className="mr-2" />
                    Retry
                  </Button>
                </div>
              ) : filteredAndSortedPredictions.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                  <AlertCircle className="text-muted-foreground mx-auto mb-4" size={48} />
                  <p className="text-foreground font-semibold mb-2">No Matching Signals</p>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto font-light">
                    {actionablePredictions.length > 0 
                      ? 'Try adjusting your filters to see more signals.'
                      : 'Markets currently showing neutral indicators. Add custom assets via search or wait for next update.'
                    }
                  </p>
                  {actionablePredictions.length > 0 && (
                    <Button onClick={handleClearFilters} variant="outline" size="sm" className="mt-4">
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="columns-1 lg:columns-2 gap-6 space-y-6">
                  {filteredAndSortedPredictions.map((prediction) => (
                    <div key={prediction.crypto.id} className="break-inside-avoid">
                      <PredictionCard prediction={prediction} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-6">
            {/* Chart Search Component */}
            <div className="bg-card border border-border rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="text-blue-400" size={20} />
                <h3 className="text-lg font-semibold text-foreground">
                  Search & Chart with Technical Analysis
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4 font-light">
                Search for any cryptocurrency to view its price chart, historical data, and advanced technical indicators
              </p>
              
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      type="text"
                      placeholder="Search for any cryptocurrency (e.g., Bitcoin, Ethereum, Solana)..."
                      value={chartSearchQuery}
                      onChange={(e) => handleChartSearchChange(e.target.value)}
                      onFocus={() => chartSearchQuery.length > 0 && setIsChartSearchOpen(true)}
                      disabled={isChartLoading}
                      className="pl-10 pr-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                    />
                    {chartSearchQuery && !isChartLoading && (
                      <button
                        onClick={handleChartSearchClose}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X size={18} />
                      </button>
                    )}
                    {isChartLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 size={18} className="animate-spin text-blue-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Chart Search Results Dropdown */}
                {isChartSearchOpen && chartSearchQuery.length > 0 && !isChartLoading && (
                  <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto z-50 border-border bg-card shadow-lg">
                    {chartSearchQueryData.isLoading ? (
                      <div className="p-4 text-center text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        Searching...
                      </div>
                    ) : chartSearchQueryData.error ? (
                      <div className="p-4 text-center text-red-400">
                        Failed to search. Please try again.
                      </div>
                    ) : chartSearchQueryData.data && chartSearchQueryData.data.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No results found for "{chartSearchQuery}"
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {chartSearchQueryData.data?.map((coin) => (
                          <button
                            key={coin.id}
                            onClick={() => handleSelectChartCoin(coin)}
                            className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={coin.thumb}
                                alt={coin.name}
                                className="w-8 h-8 rounded-full"
                              />
                              <div className="text-left">
                                <div className="font-semibold text-foreground">
                                  {coin.name}
                                </div>
                                <div className="text-sm text-muted-foreground uppercase">
                                  {coin.symbol}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {coin.market_cap_rank && (
                                <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                                  #{coin.market_cap_rank}
                                </Badge>
                              )}
                              <div className="flex items-center gap-1 text-blue-400">
                                <BarChart3 size={16} />
                                <span className="text-sm">Chart</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </Card>
                )}
              </div>
            </div>

            {/* Quick Select Buttons - Top 7 tokens */}
            {allCryptos.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Select</h3>
                <div className="flex flex-wrap gap-2">
                  {allCryptos.slice(0, 7).map((crypto) => (
                    <Button
                      key={crypto.id}
                      size="sm"
                      variant={selectedCrypto?.id === crypto.id ? 'default' : 'outline'}
                      onClick={() => setSelectedCrypto(crypto)}
                      className={`flex items-center gap-2 font-medium border-border hover:bg-muted/80 ${
                        selectedCrypto?.id === crypto.id 
                          ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700' 
                          : 'bg-card text-foreground'
                      }`}
                    >
                      <img src={crypto.image} alt={crypto.name} className="w-4 h-4 rounded-full" />
                      {crypto.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Chart */}
            {selectedCrypto && (
              <>
                <PriceChart
                  coinId={selectedCrypto.id}
                  coinName={selectedCrypto.name}
                  coinSymbol={selectedCrypto.symbol}
                  currentPrice={selectedCrypto.current_price}
                />
                
                {/* Technical Indicators Panel */}
                <TechnicalIndicatorsPanel
                  coinId={selectedCrypto.id}
                  coinName={selectedCrypto.name}
                  coinSymbol={selectedCrypto.symbol}
                  currentPrice={selectedCrypto.current_price}
                />
              </>
            )}
          </TabsContent>

          {/* Backtesting Tab */}
          <TabsContent value="backtesting" className="space-y-6">
            <BacktestingDashboard />
          </TabsContent>



          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <PortfolioTracker />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <MarketAnalytics 
              cryptos={allCryptos}
              predictions={actionablePredictions}
              marketStats={marketStats}
            />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <PredictionHistory key={historyKey} />
          </TabsContent>

          {/* Watchlist Tab */}
          <TabsContent value="watchlist">
            <WatchlistManager />
          </TabsContent>
        </Tabs>
      </main>


    </div>
  );
}
