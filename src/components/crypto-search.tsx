/**
 * Cryptocurrency search component
 * Allows users to search for any cryptocurrency by name or symbol
 * and add it to their prediction watchlist
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchCryptos, fetchCryptoById, CryptoSearchResult } from '@/lib/crypto-api';
import { CryptoData } from '@/types/crypto';
import { addToWatchlist } from '@/lib/watchlist-storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, Plus, X, TrendingUp, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface CryptoSearchProps {
  onAddCrypto: (crypto: CryptoData) => void;
  existingCryptoIds: string[];
}

export function CryptoSearch({ onAddCrypto, existingCryptoIds }: CryptoSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Search cryptocurrencies
  const searchQueryData = useQuery({
    queryKey: ['crypto-search', searchQuery],
    queryFn: () => searchCryptos(searchQuery),
    enabled: searchQuery.length > 0,
    staleTime: 60000,
  });

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleSelectCoin = async (coin: CryptoSearchResult) => {
    // Check if already added
    if (existingCryptoIds.includes(coin.id)) {
      toast.info('Already added', {
        description: `${coin.name} is already in your list.`,
      });
      return;
    }

    // Show loading state
    setIsLoading(true);
    
    try {
      console.log('Adding coin:', coin.id);
      
      // Fetch full coin data
      const coinData = await fetchCryptoById(coin.id);
      
      if (!coinData) {
        toast.error('Cannot add this coin', {
          description: 'This coin is filtered (stablecoin, wrapped token, or staking derivative).',
        });
        setIsLoading(false);
        return;
      }

      // Add to predictions
      onAddCrypto(coinData);
      
      // Also add to watchlist
      addToWatchlist({
        coinId: coinData.id,
        name: coinData.name,
        symbol: coinData.symbol,
        image: coinData.image,
      });

      // Trigger custom event to update watchlist component
      window.dispatchEvent(new Event('watchlistUpdated'));
      console.log('Dispatched watchlistUpdated event');

      // Show success message
      toast.success('Added successfully', {
        description: `${coin.name} (${coin.symbol.toUpperCase()}) has been added to your predictions and watchlist.`,
      });

      // Reset search
      setSearchQuery('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding coin:', error);
      toast.error('Failed to add coin', {
        description: 'Please try again or check your internet connection.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            type="text"
            placeholder="Search for any cryptocurrency (e.g., Monad, Solana, BTC)..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchQuery.length > 0 && setIsOpen(true)}
            disabled={isLoading}
            className="pl-10 pr-10 bg-card border-border"
          />
          {searchQuery && !isLoading && (
            <button
              onClick={handleClose}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>
          )}
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 size={18} className="animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && searchQuery.length > 0 && !isLoading && (
        <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto z-50 border-border shadow-lg">
          {searchQueryData.isLoading ? (
            <div className="p-4 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Searching...
            </div>
          ) : searchQueryData.error ? (
            <div className="p-4 text-center text-destructive">
              Failed to search. Please try again.
            </div>
          ) : searchQueryData.data && searchQueryData.data.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No results found for "{searchQuery}"
            </div>
          ) : (
            <div className="divide-y divide-border">
              {searchQueryData.data?.map((coin) => {
                const isAlreadyAdded = existingCryptoIds.includes(coin.id);
                return (
                  <button
                    key={coin.id}
                    onClick={() => !isAlreadyAdded && handleSelectCoin(coin)}
                    disabled={isAlreadyAdded}
                    className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <Badge variant="outline" className="text-xs">
                          #{coin.market_cap_rank}
                        </Badge>
                      )}
                      {isAlreadyAdded ? (
                        <Badge className="bg-muted text-muted-foreground">
                          Added
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-1 text-primary">
                          <Plus size={16} />
                          <span className="text-sm">Add</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
