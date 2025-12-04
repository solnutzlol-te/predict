/**
 * Advanced filter and sort component for predictions
 * Allows users to filter by risk, leverage, timeframe, and sort by various metrics
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { PredictionFilters, PredictionSortOption, PredictionType } from '@/types/crypto';

interface PredictionFiltersProps {
  filters: PredictionFilters;
  sortBy: PredictionSortOption;
  onFiltersChange: (filters: PredictionFilters) => void;
  onSortChange: (sort: PredictionSortOption) => void;
  onClearFilters: () => void;
  resultCount: number;
}

export function PredictionFiltersComponent({
  filters,
  sortBy,
  onFiltersChange,
  onSortChange,
  onClearFilters,
  resultCount,
}: PredictionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters = 
    filters.riskLevels.length > 0 ||
    filters.leverageRange !== null ||
    filters.timeframes.length > 0 ||
    filters.predictionTypes.length < 2;

  const toggleRiskLevel = (risk: 'Low' | 'Medium' | 'High' | 'Extreme') => {
    const newRiskLevels = filters.riskLevels.includes(risk)
      ? filters.riskLevels.filter(r => r !== risk)
      : [...filters.riskLevels, risk];
    
    onFiltersChange({ ...filters, riskLevels: newRiskLevels });
  };

  const togglePredictionType = (type: PredictionType) => {
    const newTypes = filters.predictionTypes.includes(type)
      ? filters.predictionTypes.filter(t => t !== type)
      : [...filters.predictionTypes, type];
    
    // Must have at least one type selected
    if (newTypes.length > 0) {
      onFiltersChange({ ...filters, predictionTypes: newTypes });
    }
  };

  const setLeverageRange = (range: { min: number; max: number } | null) => {
    onFiltersChange({ ...filters, leverageRange: range });
  };

  const riskColors = {
    Low: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
    Medium: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20',
    High: 'border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20',
    Extreme: 'border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20',
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="text-blue-400" size={20} />
            <CardTitle className="text-lg text-white">Filters & Sorting</CardTitle>
            {hasActiveFilters && (
              <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                {resultCount} results
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-gray-400 hover:text-white text-xs"
              >
                <X size={14} className="mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white"
            >
              {isExpanded ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Sort By */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Sort By
            </label>
            <Select value={sortBy} onValueChange={(value) => onSortChange(value as PredictionSortOption)}>
              <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="confidence-desc">Confidence (High to Low)</SelectItem>
                <SelectItem value="confidence-asc">Confidence (Low to High)</SelectItem>
                <SelectItem value="price-change-desc">Price Change (Biggest Movers)</SelectItem>
                <SelectItem value="price-change-asc">Price Change (Smallest Movers)</SelectItem>
                <SelectItem value="market-cap-desc">Market Cap (Largest First)</SelectItem>
                <SelectItem value="market-cap-asc">Market Cap (Smallest First)</SelectItem>
                <SelectItem value="volume-desc">Volume (Highest First)</SelectItem>
                <SelectItem value="volume-asc">Volume (Lowest First)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prediction Type Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Signal Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => togglePredictionType('LONG')}
                className={`flex-1 px-4 py-2.5 rounded-lg border transition-all ${
                  filters.predictionTypes.includes('LONG')
                    ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400'
                    : 'border-gray-700 bg-gray-800/50 text-gray-400'
                }`}
              >
                <TrendingUp size={16} className="inline mr-2" />
                LONG
              </button>
              <button
                onClick={() => togglePredictionType('SHORT')}
                className={`flex-1 px-4 py-2.5 rounded-lg border transition-all ${
                  filters.predictionTypes.includes('SHORT')
                    ? 'border-rose-500/50 bg-rose-500/20 text-rose-400'
                    : 'border-gray-700 bg-gray-800/50 text-gray-400'
                }`}
              >
                <TrendingDown size={16} className="inline mr-2" />
                SHORT
              </button>
            </div>
          </div>

          {/* Risk Level Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Risk Level
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['Low', 'Medium', 'High', 'Extreme'] as const).map((risk) => (
                <button
                  key={risk}
                  onClick={() => toggleRiskLevel(risk)}
                  className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
                    filters.riskLevels.includes(risk)
                      ? riskColors[risk]
                      : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                  }`}
                >
                  {risk}
                </button>
              ))}
            </div>
          </div>

          {/* Leverage Range Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Leverage Range
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <button
                onClick={() => setLeverageRange(null)}
                className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
                  filters.leverageRange === null
                    ? 'border-blue-500/50 bg-blue-500/20 text-blue-400'
                    : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                }`}
              >
                All
              </button>
              {[
                { label: '1x-3x', min: 1, max: 3 },
                { label: '3x-5x', min: 3, max: 5 },
                { label: '5x-7x', min: 5, max: 7 },
                { label: '7x+', min: 7, max: 20 },
              ].map((range) => (
                <button
                  key={range.label}
                  onClick={() => setLeverageRange({ min: range.min, max: range.max })}
                  className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
                    filters.leverageRange?.min === range.min
                      ? 'border-purple-500/50 bg-purple-500/20 text-purple-400'
                      : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
