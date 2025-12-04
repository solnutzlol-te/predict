/**
 * Market overview component displaying global crypto market statistics
 * Shows total market cap, volume, and overall market sentiment
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, BarChart3 } from 'lucide-react';

interface MarketStats {
  totalMarketCap: number;
  totalVolume: number;
  marketChange24h: number;
  activeCryptos: number;
}

interface MarketOverviewProps {
  stats: MarketStats;
}

export function MarketOverview({ stats }: MarketOverviewProps) {
  const isPositive = stats.marketChange24h > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="text-primary" size={20} />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Market Cap</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">${(stats.totalMarketCap / 1e12).toFixed(2)}T</p>
          <p className={`text-xs mt-1 ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
            {isPositive ? '+' : ''}{stats.marketChange24h.toFixed(2)}% (24h)
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="text-primary" size={20} />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">24h Volume</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">${(stats.totalVolume / 1e9).toFixed(2)}B</p>
          <p className="text-xs mt-1 text-muted-foreground">Trading activity</p>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="text-primary" size={20} />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">Market Trend</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
            {isPositive ? 'Bullish' : 'Bearish'}
          </p>
          <p className="text-xs mt-1 text-muted-foreground">Overall sentiment</p>
        </CardContent>
      </Card>
    </div>
  );
}
