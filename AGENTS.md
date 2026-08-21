# Snaplink - URL Shortener Service

## Quick Start
```bash
npm install
npm run dev   # with nodemon auto-reload
npm start     # production
```

## Project Structure
- `src/index.js` - Express app entry point
- `src/routes/urls.js` - API routes (POST /api/urls, GET /api/urls/:code, GET /:code redirect)
- `src/models/database.js` - SQLite connection + table creation (auto-runs on start)
- `src/middleware/index.js` - requestLogger, errorHandler, notFound
- `data/snaplink.db` - SQLite database file (created automatically)

## Key Conventions
- **Route order matters**: `/:code` redirect is mounted after `/api` routes in `index.js:25` to avoid conflicts
- **Short codes**: 6-char random base36 strings (`Math.random().toString(36).substring(2, 8)`)
- **DB path**: `path.join(__dirname, '../../data/snaplink.db')` from models/database.js
- **Port**: `process.env.PORT || 3000`

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/urls | Create short URL `{url}` → `{shortCode, shortUrl, originalUrl}` |
| GET | /api/urls/:code | Get URL stats |
| GET | /:code | Redirect to original URL (increments clicks) |
| GET | /health | Health check |

## No Testing/Linting/Typecheck
No test suite, linter, or TypeScript configured. Add if needed.

## Database Schema
```sql
CREATE TABLE urls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  short_code TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```