/**
 * Watchlist manager component
 * Allows users to save, organize, and quickly access their favorite cryptocurrencies
 */

import { useState, useEffect } from 'react';
import { getWatchlist, removeFromWatchlist } from '@/lib/watchlist-storage';
import { fetchCryptoById } from '@/lib/crypto-api';
import { CryptoData, WatchlistItem } from '@/types/crypto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, X, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

interface WatchlistManagerProps {
  onSelectCrypto?: (crypto: CryptoData) => void;
}

export function WatchlistManager({ onSelectCrypto }: WatchlistManagerProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  const loadWatchlist = () => {
    const items = getWatchlist();
    console.log('Loaded watchlist:', items);
    setWatchlist(items);
  };

  useEffect(() => {
    loadWatchlist();
    
    // Reload when storage changes (from search component)
    const handleStorageChange = () => {
      console.log('Storage changed, reloading watchlist...');
      loadWatchlist();
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event from same tab
    window.addEventListener('watchlistUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('watchlistUpdated', handleStorageChange);
    };
  }, []);

  const handleRemove = (coinId: string, coinName: string) => {
    removeFromWatchlist(coinId);
    loadWatchlist();
    // Trigger custom event for other components
    window.dispatchEvent(new Event('watchlistUpdated'));
    toast.success('Removed from watchlist', {
      description: `${coinName} removed successfully.`,
    });
  };

  // Fetch live data for watchlist items
  const { data: liveData, refetch, isLoading } = useQuery({
    queryKey: ['watchlist-live-data', watchlist.map(w => w.coinId).join(',')],
    queryFn: async () => {
      if (watchlist.length === 0) return [];
      
      console.log('Fetching live data for watchlist coins:', watchlist.map(w => w.coinId));
      const promises = watchlist.map(item => fetchCryptoById(item.coinId));
      const results = await Promise.allSettled(promises);
      
      const data = results
        .filter((r): r is PromiseFulfilledResult<CryptoData | null> => r.status === 'fulfilled')
        .map(r => r.value)
        .filter((data): data is CryptoData => data !== null);
      
      console.log('Fetched live data for', data.length, 'coins');
      return data;
    },
    enabled: watchlist.length > 0,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <Card className="border-gray-800/50 bg-gray-900/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="text-yellow-400 fill-yellow-400" size={20} />
            <CardTitle className="text-lg text-white">My Watchlist</CardTitle>
            <Badge variant="outline" className="border-gray-600 text-gray-300">{watchlist.length}</Badge>
          </div>
          {watchlist.length > 0 && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => refetch()}
              disabled={isLoading}
              className="border-gray-700 bg-gray-800/50 hover:bg-gray-700 text-white"
            >
              <RefreshCw size={14} className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {watchlist.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Star size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">Your watchlist is empty.</p>
            <p className="text-xs mt-1">Use the search in the Predictions tab to add cryptocurrencies to your watchlist.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {watchlist.map((item) => {
              const livePrice = liveData?.find(d => d.id === item.coinId);
              const priceChange = livePrice?.price_change_percentage_24h || 0;
              const isPositive = priceChange >= 0;

              return (
                <div
                  key={item.coinId}
                  className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 hover:border-gray-600 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <h4 className="font-semibold text-white">
                          {item.name}
                        </h4>
                        <p className="text-xs text-gray-400">
                          {item.symbol.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isLoading ? (
                        <p className="text-xs text-gray-400">Loading...</p>
                      ) : livePrice ? (
                        <div className="text-right">
                          <p className="font-semibold text-white">
                            ${livePrice.current_price.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 6,
                            })}
                          </p>
                          <Badge
                            className={`text-xs ${isPositive ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50'}`}
                          >
                            {isPositive ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
                            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                          </Badge>
                        </div>
                      ) : (
                        <p className="text-xs text-red-400">Failed to load</p>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => handleRemove(item.coinId, item.name)}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
