# Crypto Prediction Hub - Project Overview

A professional cryptocurrency prediction platform with real-time price data and **comprehensive technical analysis** using RSI, MACD, Bollinger Bands, and Support/Resistance levels.

## ✨ Key Features Implemented

### 🎯 Core Functionality
- **Real-time Price Data**: Live cryptocurrency prices via backend proxy (no CORS issues!)
- **Advanced Technical Analysis**: RSI, MACD, Bollinger Bands, Support/Resistance detection
- **LONG/SHORT Signals**: Clear trading recommendations (no neutral)
- **Interactive Price Charts**: Multiple timeframes (1D, 7D, 30D, 90D, 1Y)
- **Search Any Cryptocurrency**: Find and track any coin from CoinGecko
- **Trading Platform Links**: Direct links to Hyperliquid, Binance, Bybit, OKX

### 📊 Advanced Features
- **Prediction History**: Track prediction outcomes and accuracy
- **Performance Analytics**: Win rate, profit/loss statistics
- **Watchlist Manager**: Save and organize favorite coins
- **Portfolio Tracker**: Monitor holdings and P/L (coming soon)
- **Market Analytics**: Global market trends and insights
- **Backtesting System**: Test strategies on historical data
- **Advanced Filters**: Filter by risk, leverage, timeframe

### 🌐 **NEW: Centralized Backend (Global Predictions & History)**
- ✅ **Same predictions on ALL browsers/devices**
- ✅ **History persists across sessions**
- ✅ **Automatic evaluation of pending predictions**
- ✅ **Real-time statistics shared globally**
- ✅ **Backend proxy for CoinGecko API (CORS-free)**
- ⚠️ **Currently using in-memory storage** (data resets on server restart)
- 📝 **Production requires database setup** (see below)

## Project Structure

### Documentation
- `docs/prd.md`: Product requirements and specifications
- `docs/todo.md`: Implementation task list (Phase 21 complete)
- `docs/overview.md`: This file - project architecture overview
- `docs/DATABASE_SETUP.md`: Complete database setup guide

### Configuration Files
- `tailwind.config.ts`: Tailwind CSS configuration with custom trading theme
- `src/styles/globals.css`: Global styles with dark trading interface theme
- `index.html`: HTML entry point with SEO metadata

### Type Definitions
- `src/types/crypto.ts`: Complete TypeScript interfaces for all data structures

### Core Logic & API Integration

#### Frontend APIs
- `src/lib/crypto-api.ts`: **UPDATED** - Now uses backend proxy (no direct CoinGecko calls, CORS-free!)
- `src/lib/prediction-engine.ts`: **FULLY ENHANCED** technical analysis engine with RSI, MACD, Bollinger Bands
- `src/lib/technical-indicators.ts`: Advanced technical analysis library with all indicator calculations
- `src/lib/predictions-api.ts`: **NEW** - API client for centralized predictions and history
- `src/lib/prediction-history.ts`: **UPDATED** - Now uses centralized backend with localStorage fallback
- `src/lib/watchlist-storage.ts`: Local storage for watchlist (still client-side)
- `src/lib/portfolio-storage.ts`: Local storage for portfolio tracking
- `src/lib/backtesting-engine.ts`: Strategy backtesting system
- `src/lib/trading-platforms.ts`: Trading platform integration and URL generation

#### Backend APIs (Server)

**Predictions API** (`src/server/routes/predictions.ts`):
- `GET /api/predictions` - Fetch latest predictions (global)
- `POST /api/predictions` - Save new predictions
- `GET /api/predictions/history` - Fetch prediction history
- `POST /api/predictions/evaluate` - Evaluate pending predictions
- `GET /api/predictions/stats` - Get prediction statistics

**CoinGecko Proxy API** (`src/server/routes/coingecko.ts`) - **NEW!**:
- `GET /api/coingecko/markets` - Fetch top cryptocurrencies by market cap
- `GET /api/coingecko/global` - Fetch global market statistics
- `GET /api/coingecko/search?query=...` - Search for cryptocurrencies
- `GET /api/coingecko/coin/:id` - Fetch detailed data for a specific coin
- `GET /api/coingecko/price-history/:id?days=...` - Fetch historical price data
- **Benefits**: 
  - ✅ Eliminates CORS issues (server-side requests)
  - ✅ Server-side caching (30-second TTL)
  - ✅ Centralized error handling
  - ✅ Future-proof for API key management

**Database & Routes**:
- `src/server/database.ts`: **NEW** - Database interface (currently in-memory, needs real DB)
- `src/server/schema.ts`: **UPDATED** - Added prediction and history schemas
- `src/server/routes/index.ts`: **UPDATED** - Registered all routes (predictions + coingecko)
- `src/server/routes/example.ts`: Example route (reference only)

### UI Components

#### Navigation & Layout
- `src/components/navigation-header.tsx`: Professional navigation header with tabs

#### Core Prediction Components
- `src/components/sentiment-badge.tsx`: Color-coded sentiment indicator
- `src/components/prediction-card.tsx`: Comprehensive prediction display with technical indicators
- `src/components/prediction-filters.tsx`: Advanced filtering and sorting
- `src/components/prediction-history.tsx`: **UPDATED** - Now fetches from centralized API

#### Analysis & Visualization
- `src/components/price-chart.tsx`: Interactive price charts with Recharts
- `src/components/technical-indicators-panel.tsx`: Technical analysis visualization
- `src/components/market-analytics.tsx`: Market trends and sector performance
- `src/components/market-overview.tsx`: Global market statistics

#### Utility Components
- `src/components/crypto-search.tsx`: Search and add any cryptocurrency
- `src/components/watchlist-manager.tsx`: Manage favorite cryptocurrencies
- `src/components/portfolio-tracker.tsx`: Portfolio tracking (coming soon)
- `src/components/backtesting-dashboard.tsx`: Backtesting interface

### Main Application
- `src/pages/home.tsx`: Main application with tabbed interface
- `src/pages/404.tsx`: Custom 404 error page
- `src/App.tsx`: Root application component with routing

## 🗄️ Database Setup (Required for Production)

**⚠️ IMPORTANT**: The current implementation uses **in-memory storage**, which means:
- Data is lost when the server restarts
- Predictions and history will NOT persist

### To Enable Persistent Storage:

#### Option 1: Neon PostgreSQL (Recommended) ⭐
1. Go to https://neon.tech
2. Create a free account
3. Create a new project
4. Copy the connection string
5. Add to environment variables: `DATABASE_URL=postgresql://...`
6. Run the SQL schema (see `docs/DATABASE_SETUP.md`)
7. Update `src/server/database.ts` with PostgreSQL implementation

See `docs/DATABASE_SETUP.md` for complete step-by-step instructions.

#### Option 2: Turso SQLite
1. Go to https://turso.tech
2. Create account and database
3. Copy URL and auth token
4. Add to environment variables
5. Update `src/server/database.ts` with Turso client

#### Option 3: Supabase
1. Go to https://supabase.com
2. Create project
3. Use built-in PostgreSQL
4. Copy connection string
5. Update database module

## Technical Stack

### Frontend
- **React 19** with TypeScript
- **React Router** for navigation
- **React Query** for data fetching and caching
- **Tailwind CSS** with custom trading theme
- **shadcn/ui** component library
- **Recharts** for data visualization
- **Lucide Icons** for consistent iconography
- **Framer Motion** for animations
- **Zod** for schema validation

### Backend
- **Hono.js** - Fast web framework for Deno/Node
- **Hono RPC** - Type-safe API client
- **Zod** - Runtime validation
- **Deno Runtime** - Modern JavaScript runtime
- **Backend Proxy Architecture** - Eliminates CORS issues

### APIs & Data Sources
- **CoinGecko API**: Real-time crypto prices and market data (via backend proxy)
- **Technical Indicators**: Custom-built RSI, MACD, Bollinger Bands calculations

## Development Notes

### Key Principles
1. **Type Safety**: Strict TypeScript everywhere
2. **Real Data**: All prices and data from live APIs
3. **Technical Analysis**: Professional indicators (RSI, MACD, BB, S/R)
4. **User Experience**: Fast, responsive, intuitive interface
5. **Global State**: Centralized backend for shared predictions
6. **CORS-Free**: Backend proxy eliminates browser CORS issues

### Performance Optimizations
- React Query caching (30-second stale time)
- Backend API caching (30-second TTL)
- Auto-refresh every 30 seconds
- Memoized calculations
- Optimized re-renders
- Lazy loading for large datasets

### Architecture Improvements (Phase 21)
- ✅ **Backend CoinGecko Proxy**: All API calls now go through `/api/coingecko/*`
- ✅ **CORS Issues Resolved**: No more browser CORS errors
- ✅ **Server-Side Caching**: 30-second cache reduces API load
- ✅ **Consistent Error Handling**: Better error messages and logging
- ✅ **Future-Proof**: Ready for API key management and rate limiting

### Removed Features
- ❌ News sentiment analysis (Phase 19)
- ❌ Light/Dark mode toggle (not priority)
- ❌ Neutral predictions (only LONG/SHORT shown)

## Future Enhancements
- [ ] Real database integration (Neon/Turso)
- [ ] User authentication
- [ ] Portfolio tracking with real trades
- [ ] Social features (share predictions)
- [ ] Advanced charting (TradingView integration)
- [ ] Mobile app (React Native)
- [ ] Email/push notifications for signals
- [ ] API key management
- [ ] Premium features
- [ ] Rate limiting on backend proxy

## Known Limitations
- In-memory storage (temporary, needs database)
- Backend proxy caching (30-second TTL)
- Predictions are algorithmic, not financial advice
- No real trading execution (links to platforms only)

## Recent Changes (Phase 21)

### What was fixed:
1. **CORS Errors**: All CoinGecko API calls now routed through backend proxy
2. **Backend Architecture**: Created `/api/coingecko/*` proxy endpoints
3. **Caching**: Server-side caching reduces API load and improves performance
4. **Frontend API**: Updated `crypto-api.ts` to use backend proxy exclusively

### Result:
- ✅ No more CORS errors in browser console
- ✅ Faster data fetching with server-side cache
- ✅ More reliable API calls
- ✅ Better error handling and logging
- ✅ Ready for API key management in future

