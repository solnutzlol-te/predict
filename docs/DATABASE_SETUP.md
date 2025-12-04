# Database Setup Guide

## 🚨 Why You Need a Database

Your app currently uses **in-memory storage**, which means:
- ❌ Data is lost when server restarts
- ❌ Predictions don't persist
- ❌ History doesn't sync across browsers

To enable **global, persistent predictions and history**, you need a database.

---

## ⭐ Recommended: Neon PostgreSQL (Free Tier)

### Why Neon?
- ✅ **Free tier** with 512 MB storage
- ✅ **Serverless** - no infrastructure management
- ✅ **Fast** - optimized for edge functions
- ✅ **Easy setup** - 2-minute process

### Setup Steps:

#### 1. Create Neon Account
1. Go to https://neon.tech
2. Click "Sign Up" (use GitHub or email)
3. Complete registration

#### 2. Create Database Project
1. Click "Create a project"
2. Choose a name (e.g., "monfutures-db")
3. Select region closest to your users
4. Click "Create Project"

#### 3. Get Connection String
1. In your project dashboard, find the **Connection Details** section
2. Copy the connection string (looks like this):
   ```
   postgresql://user:password@ep-example-123.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

#### 4. Add to Environment Variables
1. In your deployment platform (Vercel, Netlify, Railway, etc.):
   - Go to Settings → Environment Variables
   - Add: `DATABASE_URL` = `your-connection-string`

2. For local development, create `.env` file:
   ```bash
   DATABASE_URL=postgresql://user:password@ep-example-123.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

#### 5. Create Database Tables

Connect to your Neon database using their SQL Editor and run:

```sql
-- Predictions table
CREATE TABLE predictions (
  id TEXT PRIMARY KEY,
  coin_id TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  coin_symbol TEXT NOT NULL,
  prediction TEXT NOT NULL CHECK (prediction IN ('LONG', 'SHORT', 'NEUTRAL')),
  sentiment TEXT NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  predicted_price REAL NOT NULL,
  target_price REAL NOT NULL,
  stop_loss REAL NOT NULL,
  leverage INTEGER NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High', 'Extreme')),
  timeframe TEXT NOT NULL,
  analysis TEXT NOT NULL,
  reasons TEXT NOT NULL, -- JSON format
  indicators TEXT NOT NULL, -- JSON format
  created_at BIGINT NOT NULL
);

-- Prediction history table
CREATE TABLE prediction_history (
  id TEXT PRIMARY KEY,
  prediction_id TEXT NOT NULL,
  coin_id TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  coin_symbol TEXT NOT NULL,
  prediction TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  predicted_price REAL NOT NULL,
  target_price REAL NOT NULL,
  stop_loss REAL NOT NULL,
  actual_price REAL,
  timestamp BIGINT NOT NULL,
  evaluated_at BIGINT,
  outcome TEXT NOT NULL DEFAULT 'pending' CHECK (outcome IN ('pending', 'win', 'loss', 'neutral')),
  profit_loss REAL,
  FOREIGN KEY (prediction_id) REFERENCES predictions(id)
);

-- Indexes for performance
CREATE INDEX idx_predictions_coin ON predictions(coin_id);
CREATE INDEX idx_predictions_created ON predictions(created_at DESC);
CREATE INDEX idx_history_timestamp ON prediction_history(timestamp DESC);
CREATE INDEX idx_history_outcome ON prediction_history(outcome);
CREATE INDEX idx_history_coin ON prediction_history(coin_id);
```

#### 6. Install PostgreSQL Client

In your project, install the `pg` (PostgreSQL) client:

```bash
npm install pg
```

#### 7. Update Database Module

Replace the in-memory implementation in `src/server/database.ts` with real PostgreSQL queries.

**Example implementation** (you'll need to adapt this):

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export const db = {
  async getLatestPredictions() {
    const result = await pool.query(`
      SELECT DISTINCT ON (coin_id) 
        id, coin_id, coin_name, coin_symbol, prediction, sentiment,
        confidence, predicted_price, target_price, stop_loss, leverage,
        risk_level, timeframe, analysis, reasons, indicators, created_at
      FROM predictions
      ORDER BY coin_id, created_at DESC
    `);
    
    return result.rows.map(row => ({
      ...row,
      reasons: JSON.parse(row.reasons),
      indicators: JSON.parse(row.indicators),
    }));
  },
  
  async savePrediction(data) {
    const id = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    await pool.query(`
      INSERT INTO predictions (
        id, coin_id, coin_name, coin_symbol, prediction, sentiment,
        confidence, predicted_price, target_price, stop_loss, leverage,
        risk_level, timeframe, analysis, reasons, indicators, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `, [
      id, data.coinId, data.coinName, data.coinSymbol, data.prediction,
      data.sentiment, data.confidence, data.predictedPrice, data.targetPrice,
      data.stopLoss, data.leverage, data.riskLevel, data.timeframe,
      data.analysis, JSON.stringify(data.reasons), JSON.stringify(data.indicators),
      now
    ]);
    
    // Also insert into history
    const histId = `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await pool.query(`
      INSERT INTO prediction_history (
        id, prediction_id, coin_id, coin_name, coin_symbol, prediction,
        confidence, predicted_price, target_price, stop_loss, timestamp, outcome
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
    `, [
      histId, id, data.coinId, data.coinName, data.coinSymbol,
      data.prediction, data.confidence, data.predictedPrice,
      data.targetPrice, data.stopLoss, now
    ]);
    
    return { id, ...data, createdAt: now };
  },
  
  // ... implement other methods similarly
};
```

---

## Alternative: Turso SQLite

If you prefer SQLite over PostgreSQL:

### Setup:
1. Go to https://turso.tech
2. Create account and project
3. Install Turso client: `npm install @libsql/client`
4. Get database URL and auth token
5. Add to environment:
   ```
   TURSO_DATABASE_URL=libsql://your-db.turso.io
   TURSO_AUTH_TOKEN=your-token
   ```

### Usage:
```typescript
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = {
  async getLatestPredictions() {
    const result = await client.execute({
      sql: `SELECT * FROM predictions ORDER BY created_at DESC`,
      args: [],
    });
    return result.rows;
  },
  // ... other methods
};
```

---

## Testing Database Connection

After setup, verify it works:

1. Restart your server
2. Open your app in two different browsers
3. Generate predictions in one browser
4. Refresh the other browser
5. **✅ Both should show the same predictions!**

---

## Troubleshooting

### "Connection refused"
- Check `DATABASE_URL` is correct
- Verify database is running
- Check SSL settings (Neon requires SSL)

### "Table doesn't exist"
- Run the SQL schema creation script
- Check table names match exactly

### "Environment variable not found"
- Ensure `DATABASE_URL` is set
- Restart your development server
- Check .env file is in project root

---

## Need Help?

If you get stuck:
1. Check Neon documentation: https://neon.tech/docs
2. Verify environment variables are set
3. Check server logs for error messages
4. Test database connection separately first

---

## What Happens After Database Setup?

✅ **Predictions sync across all browsers**  
✅ **History persists forever**  
✅ **Statistics are global**  
✅ **No data loss on server restart**  
✅ **True multi-user support**  

Your app will be production-ready! 🚀
