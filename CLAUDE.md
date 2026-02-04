# CLAUDE.md

## Overview

**Tweet Recall** — A privacy-first Chrome extension that captures tweets as you browse Twitter/X and lets you search through them later. All data stays local in your browser.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Tweet Recall Extension                     │
├─────────────────────────────────────────────────────────────┤
│  Content Script (src/content/)                               │
│  ├── IntersectionObserver → only captures viewed tweets      │
│  ├── MutationObserver → detects new tweets in DOM            │
│  └── Tweet Parser → extracts structured data                 │
├─────────────────────────────────────────────────────────────┤
│  Background Worker (src/background/)                         │
│  ├── IndexedDB → local storage via idb library               │
│  ├── MiniSearch → full-text search with fuzzy matching       │
│  └── Message Handler → content script ↔ popup communication  │
├─────────────────────────────────────────────────────────────┤
│  Popup UI (src/popup/)                                       │
│  ├── Search bar with instant results                         │
│  ├── Tweet previews with metadata badges                     │
│  └── Settings panel (export, clear data)                     │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
tweet-recall/
├── src/
│   ├── content/index.ts      # Content script - tweet capture on x.com
│   ├── background/index.ts   # Service worker - IndexedDB + search
│   ├── popup/
│   │   ├── index.html        # Popup markup
│   │   ├── main.ts           # Popup logic
│   │   └── style.css         # Dark theme styles
│   ├── lib/
│   │   ├── db.ts             # IndexedDB wrapper using idb
│   │   ├── search.ts         # MiniSearch configuration
│   │   └── tweet-parser.ts   # DOM parsing for tweet extraction
│   └── types/index.ts        # Shared TypeScript types
├── public/icons/             # Extension icons (16, 48, 128px)
├── dist/                     # Built extension (load in Chrome)
├── manifest.json             # Chrome extension manifest v3
├── vite.config.ts            # Vite + CRXJS build config
└── package.json
```

## Development Commands

```bash
pnpm install      # Install dependencies
pnpm dev          # Development with hot reload
pnpm build        # Production build → dist/
```

## Loading the Extension

1. Run `pnpm build`
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** → select `dist/` folder

## Tech Stack

| Layer | Technology |
|-------|------------|
| Build | Vite + @crxjs/vite-plugin |
| Language | TypeScript (strict mode) |
| Storage | IndexedDB via `idb` library |
| Search | MiniSearch (full-text, fuzzy) |
| UI | Vanilla HTML/CSS (Twitter dark theme) |

## Key Design Decisions

### Privacy-First Storage
- All data stored in browser's IndexedDB
- No network requests, no external servers
- User controls their data (export/delete)

### Viewport-Based Capture
- Uses `IntersectionObserver` with 50% threshold
- Only captures tweets the user actually scrolled past
- Avoids capturing prefetched/hidden tweets

### Debounced Processing
- Tweets queued and batch-sent every 500ms
- Minimizes performance impact while scrolling
- Deduplication by tweet ID

### Search Architecture
- MiniSearch indexes: text, author, authorName, quotedText
- Boost weights: text (2x), author/authorName (1.5x)
- Fuzzy matching enabled (0.2 threshold)
- Prefix search enabled

## Data Schema

```typescript
interface CapturedTweet {
  id: string;           // Tweet ID (primary key, dedup)
  text: string;         // Full tweet text
  author: string;       // @handle
  authorName: string;   // Display name
  postedAt: number;     // Tweet timestamp
  seenAt: number;       // When user saw it
  url: string;          // Direct link to tweet
  hasMedia: boolean;    // Contains images/video
  isRetweet: boolean;   // Is a retweet
  isThread: boolean;    // Part of thread
  quotedText?: string;  // Quoted tweet text
  quotedAuthor?: string;// Quoted tweet author
}
```

## Message Protocol

Content script and popup communicate with background worker via Chrome messaging:

| Message Type | Direction | Purpose |
|--------------|-----------|---------|
| `TWEETS_CAPTURED` | Content → Background | Store new tweets |
| `SEARCH_TWEETS` | Popup → Background | Query search index |
| `GET_STATS` | Popup → Background | Get storage statistics |
| `CLEAR_ALL` | Popup → Background | Delete all data |
| `EXPORT_DATA` | Popup → Background | Export as JSON |

## Important Implementation Details

### Tweet Parsing (src/lib/tweet-parser.ts)
- Targets `article[data-testid="tweet"]` elements
- Extracts tweet ID from `/status/{id}` URLs
- Handles quote tweets and retweets
- Gracefully handles missing elements

### IndexedDB Schema (src/lib/db.ts)
- Database: `tweet-recall`
- Object store: `tweets` (keyPath: `id`)
- Indexes: `by-seen-at`, `by-author`

### Search Index (src/lib/search.ts)
- Lazy initialization on first query
- Incremental updates for new tweets
- Stores all fields for result display

## Chrome Extension Permissions

```json
{
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["https://x.com/*", "https://twitter.com/*"]
}
```

Minimal permissions - only what's needed for functionality.

## Common Tasks

### Adding a New Tweet Field
1. Update `CapturedTweet` type in `src/types/index.ts`
2. Extract field in `src/lib/tweet-parser.ts`
3. Add to `storeFields` in `src/lib/search.ts` if searchable
4. Update popup UI in `src/popup/main.ts` if displayed

### Modifying Search Behavior
- Edit `src/lib/search.ts`
- `fields` array controls what's searchable
- `boost` object controls relevance weighting
- `fuzzy` and `prefix` control matching behavior

### Changing Capture Behavior
- Edit `src/content/index.ts`
- `VIEWPORT_THRESHOLD` controls visibility requirement
- `CAPTURE_DEBOUNCE_MS` controls batch timing

## Testing

Manual testing workflow:
1. Load extension in Chrome
2. Browse twitter.com or x.com
3. Scroll through timeline
4. Click extension icon → search for seen tweets
5. Verify results link to correct tweets

## Troubleshooting

**Extension not capturing tweets:**
- Check Chrome DevTools console on x.com for errors
- Verify content script is injected (Sources → Content scripts)
- Twitter may have changed DOM structure (update selectors in tweet-parser.ts)

**Search not returning results:**
- Check background worker console (chrome://extensions → Inspect views)
- Verify IndexedDB has data (DevTools → Application → IndexedDB)
- Index may need rebuild (clear and recapture)

**Icons not showing:**
- Ensure PNG files exist in `dist/public/icons/`
- Check manifest.json icon paths match actual locations

## Code Style

- TypeScript strict mode enabled
- No `any` types - use proper typing
- Async/await for all async operations
- Descriptive function and variable names
- JSDoc comments for public functions
