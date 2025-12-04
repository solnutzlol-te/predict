/**
 * Interactive price chart component
 * Displays historical price data with customizable timeframes
 * Uses Recharts for visualization
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPriceHistory } from '@/lib/crypto-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface PriceChartProps {
  coinId: string;
  coinName: string;
  coinSymbol: string;
  currentPrice: number;
}

type TimeframeOption = {
  label: string;
  days: number;
};

const TIMEFRAMES: TimeframeOption[] = [
  { label: '24H', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

export function PriceChart({ coinId, coinName, coinSymbol, currentPrice }: PriceChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>(TIMEFRAMES[1]); // Default to 7D

  const { data, isLoading, error } = useQuery({
    queryKey: ['price-history', coinId, selectedTimeframe.days],
    queryFn: () => fetchPriceHistory(coinId, selectedTimeframe.days),
    staleTime: 60000, // 1 minute
  });

  // Prepare chart data
  const chartData = data?.prices.map(point => ({
    timestamp: point.timestamp,
    price: point.price,
    formattedTime: format(new Date(point.timestamp), selectedTimeframe.days === 1 ? 'HH:mm' : 'MMM dd'),
  })) || [];

  // Calculate price change
  let priceChange = 0;
  let priceChangePercent = 0;
  if (chartData.length > 1) {
    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;
    priceChange = lastPrice - firstPrice;
    priceChangePercent = (priceChange / firstPrice) * 100;
  }

  const isPositive = priceChange >= 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-xs text-muted-foreground mb-1">
            {format(new Date(data.timestamp), 'MMM dd, yyyy HH:mm')}
          </p>
          <p className="text-sm font-bold text-foreground">
            ${data.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="text-primary" size={20} />
            <div>
              <CardTitle className="text-lg">
                {coinName} ({coinSymbol.toUpperCase()}) Price Chart
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">
                  ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </span>
                {chartData.length > 1 && (
                  <Badge
                    className={`flex items-center gap-1 ${isPositive ? 'bg-bullish/20 text-bullish border-bullish/50' : 'bg-bearish/20 text-bearish border-bearish/50'}`}
                  >
                    {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Timeframe selector */}
        <div className="flex gap-2 mb-4">
          {TIMEFRAMES.map((timeframe) => (
            <Button
              key={timeframe.days}
              size="sm"
              variant={selectedTimeframe.days === timeframe.days ? 'default' : 'outline'}
              onClick={() => setSelectedTimeframe(timeframe)}
              className="text-xs"
            >
              {timeframe.label}
            </Button>
          ))}
        </div>

        {/* Chart */}
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-lg animate-pulse">
            <p className="text-muted-foreground">Loading chart...</p>
          </div>
        ) : error ? (
          <div className="h-[300px] flex items-center justify-center bg-destructive/10 rounded-lg">
            <p className="text-destructive text-sm">Failed to load chart data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="formattedTime"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke={isPositive ? 'hsl(var(--bullish))' : 'hsl(var(--bearish))'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: isPositive ? 'hsl(var(--bullish))' : 'hsl(var(--bearish))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
