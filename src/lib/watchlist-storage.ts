/**
 * Local storage management for cryptocurrency watchlist
 * Provides functions to save, retrieve, and manage user's favorite cryptocurrencies
 */

import { WatchlistItem } from '@/types/crypto';

const WATCHLIST_KEY = 'crypto-prediction-watchlist';

/**
 * Retrieves the current watchlist from local storage
 * @returns Array of watchlist items
 */
export function getWatchlist(): WatchlistItem[] {
  try {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading watchlist from storage:', error);
    return [];
  }
}

/**
 * Saves the watchlist to local storage
 * @param watchlist - Array of watchlist items to save
 */
export function saveWatchlist(watchlist: WatchlistItem[]): void {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  } catch (error) {
    console.error('Error saving watchlist to storage:', error);
  }
}

/**
 * Adds a cryptocurrency to the watchlist
 * @param item - Watchlist item to add
 * @returns Updated watchlist
 */
export function addToWatchlist(item: Omit<WatchlistItem, 'addedAt'>): WatchlistItem[] {
  const watchlist = getWatchlist();
  
  // Check if already exists
  if (watchlist.some(w => w.coinId === item.coinId)) {
    return watchlist;
  }
  
  const newItem: WatchlistItem = {
    ...item,
    addedAt: Date.now(),
  };
  
  const updated = [newItem, ...watchlist];
  saveWatchlist(updated);
  return updated;
}

/**
 * Removes a cryptocurrency from the watchlist
 * @param coinId - CoinGecko coin ID to remove
 * @returns Updated watchlist
 */
export function removeFromWatchlist(coinId: string): WatchlistItem[] {
  const watchlist = getWatchlist();
  const updated = watchlist.filter(w => w.coinId !== coinId);
  saveWatchlist(updated);
  return updated;
}

/**
 * Checks if a cryptocurrency is in the watchlist
 * @param coinId - CoinGecko coin ID to check
 * @returns True if in watchlist, false otherwise
 */
export function isInWatchlist(coinId: string): boolean {
  const watchlist = getWatchlist();
  return watchlist.some(w => w.coinId === coinId);
}

/**
 * Clears the entire watchlist
 */
export function clearWatchlist(): void {
  try {
    localStorage.removeItem(WATCHLIST_KEY);
  } catch (error) {
    console.error('Error clearing watchlist:', error);
  }
}
