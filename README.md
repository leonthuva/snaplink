# Snaplink

A URL shortener and bookmark service with AI-powered auto-tagging and summarization.

## Features

- **URL Shortening**: Create short links with custom codes
- **Bookmark Management**: Full CRUD for bookmarks with categories, tags, and search
- **AI Auto-Tagging**: Uses Google Gemini to analyze webpage content and generate relevant tags
- **AI Summarization**: Generates 1-sentence summaries of bookmarked pages
- **Fallback Mode**: Keyword-based tagging when AI API is unavailable

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start development server
npm run dev

# Or production
npm start
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes* | - | Google Gemini API key for AI features |
| `GEMINI_MODEL` | No | `gemini-1.5-flash` | Model to use (flash/pro) |
| `AI_TIMEOUT_MS` | No | `10000` | Request timeout in ms |
| `AI_MAX_RETRIES` | No | `1` | Max retry attempts |
| `PORT` | No | `3000` | Server port |

*Required for AI features. Without it, keyword-based fallback is used.

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key to your `.env` file

The free tier includes generous limits for development.

## API Endpoints

### URL Shortener
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/urls` | Create short URL `{url}` → `{shortCode, shortUrl, originalUrl}` |
| GET | `/api/urls/:code` | Get URL stats |
| GET | `/:code` | Redirect to original URL (increments clicks) |

### Bookmarks
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/bookmarks` | Create bookmark (auto-generates tags/summary via AI) |
| GET | `/api/bookmarks` | List bookmarks (query: `category`, `tag`, `search`, `limit`, `offset`) |
| GET | `/api/bookmarks/:id` | Get bookmark by ID |
| PUT | `/api/bookmarks/:id` | Update bookmark |
| DELETE | `/api/bookmarks/:id` | Delete bookmark |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |

## Bookmark Creation with AI

When creating a bookmark without `tags` or `summary`:

```bash
curl -X POST http://localhost:3000/api/bookmarks \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com/microsoft/vscode","title":"VS Code"}'
```

The service will:
1. Fetch the webpage content (title, meta description, body text)
2. Send to Gemini AI for analysis
3. Return generated tags (3-5) and 1-sentence summary
4. Save bookmark with AI-generated metadata

If AI fails (network error, rate limit, invalid key), it falls back to keyword-based tagging using the domain name.

## Project Structure

```
src/
├── index.js              # Express app entry point
├── models/
│   ├── database.js       # SQLite connection + schema
│   └── bookmark.js       # Bookmark model (CRUD + search)
├── routes/
│   ├── urls.js           # URL shortener routes
│   └── bookmarks.js      # Bookmark CRUD routes
├── middleware/
│   └── index.js          # Logging, error handling, validation
└── services/
    └── aiProcessor.js    # AI tagging/summarization (Gemini + fallback)

data/
└── snaplink.db           # SQLite database (auto-created)
```

## Database Schema

```sql
-- URLs table (shortener)
CREATE TABLE urls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  short_code TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bookmarks table
CREATE TABLE bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  title TEXT,
  summary TEXT,
  tags TEXT,              -- JSON array as text
  category TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Development

```bash
# Run with auto-reload
npm run dev

# Run tests (when added)
npm test
```

## License

MIT