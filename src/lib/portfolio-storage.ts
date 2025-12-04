/**
 * Portfolio storage management for cryptocurrency holdings
 * Provides functions to save, retrieve, and manage user's portfolio in local storage
 */

import { PortfolioHolding } from '@/types/crypto';

const PORTFOLIO_KEY = 'crypto-prediction-portfolio';

/**
 * Retrieves all portfolio holdings from local storage
 * @returns Array of portfolio holdings
 */
export function getPortfolioHoldings(): PortfolioHolding[] {
  try {
    const stored = localStorage.getItem(PORTFOLIO_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading portfolio from storage:', error);
    return [];
  }
}

/**
 * Saves portfolio holdings to local storage
 * @param holdings - Array of portfolio holdings to save
 */
export function savePortfolioHoldings(holdings: PortfolioHolding[]): void {
  try {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(holdings));
  } catch (error) {
    console.error('Error saving portfolio to storage:', error);
  }
}

/**
 * Adds a new holding to the portfolio
 * @param holding - Portfolio holding to add (without ID)
 * @returns Updated portfolio holdings
 */
export function addPortfolioHolding(
  holding: Omit<PortfolioHolding, 'id'>
): PortfolioHolding[] {
  const holdings = getPortfolioHoldings();
  
  const newHolding: PortfolioHolding = {
    ...holding,
    id: `holding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  
  const updated = [newHolding, ...holdings];
  savePortfolioHoldings(updated);
  return updated;
}

/**
 * Updates an existing holding in the portfolio
 * @param holdingId - ID of the holding to update
 * @param updates - Partial updates to apply
 * @returns Updated portfolio holdings
 */
export function updatePortfolioHolding(
  holdingId: string,
  updates: Partial<Omit<PortfolioHolding, 'id' | 'coinId'>>
): PortfolioHolding[] {
  const holdings = getPortfolioHoldings();
  const updated = holdings.map(h => 
    h.id === holdingId ? { ...h, ...updates } : h
  );
  savePortfolioHoldings(updated);
  return updated;
}

/**
 * Removes a holding from the portfolio
 * @param holdingId - ID of the holding to remove
 * @returns Updated portfolio holdings
 */
export function removePortfolioHolding(holdingId: string): PortfolioHolding[] {
  const holdings = getPortfolioHoldings();
  const updated = holdings.filter(h => h.id !== holdingId);
  savePortfolioHoldings(updated);
  return updated;
}

/**
 * Checks if a coin is already in the portfolio
 * @param coinId - CoinGecko coin ID to check
 * @returns True if coin exists in portfolio
 */
export function isCoinInPortfolio(coinId: string): boolean {
  const holdings = getPortfolioHoldings();
  return holdings.some(h => h.coinId === coinId);
}

/**
 * Gets all holdings for a specific coin
 * @param coinId - CoinGecko coin ID
 * @returns Array of holdings for that coin
 */
export function getHoldingsByCoin(coinId: string): PortfolioHolding[] {
  const holdings = getPortfolioHoldings();
  return holdings.filter(h => h.coinId === coinId);
}

/**
 * Clears the entire portfolio
 */
export function clearPortfolio(): void {
  try {
    localStorage.removeItem(PORTFOLIO_KEY);
  } catch (error) {
    console.error('Error clearing portfolio:', error);
  }
}
