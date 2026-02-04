# Tweet Recall

**Remember every tweet you've seen. Search your Twitter browsing history.**

A privacy-first Chrome extension that captures tweets as you browse Twitter/X and lets you search through them later. All data stays local in your browser.

## Features

- 🔍 **Instant Search**: Full-text search across all tweets you've seen with fuzzy matching
- 🔒 **Privacy-First**: All data stored locally in IndexedDB - no servers, no accounts
- ⚡ **Lightweight**: Passive capture with minimal CPU overhead via debounced processing
- 📸 **Smart Capture**: Only captures tweets that enter your viewport (what you actually see)
- 🔗 **Direct Links**: Click any result to open the original tweet
- 📊 **Statistics**: See how many tweets you've captured and from how many authors
- 💾 **Export**: Download your tweet history as JSON
- 🎨 **Native UI**: Dark theme matching Twitter/X aesthetic

## Installation

### Development

1. **Clone and install dependencies:**
   ```bash
   cd /Users/souravbhar/Documents/code/tweet-recall
   pnpm install
   ```

2. **Build the extension:**
   ```bash
   pnpm build
   ```

3. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

4. **For development with hot reload:**
   ```bash
   pnpm dev
   ```
   Then load the `dist` folder as an unpacked extension.

### Production Build

```bash
pnpm build
```

The built extension will be in the `dist` folder, ready to be packaged for the Chrome Web Store.

## Usage

1. **Browse Twitter/X normally** - tweets are captured automatically as you scroll
2. **Click the extension icon** to open the search popup
3. **Type to search** - results appear instantly with fuzzy matching
4. **Click a result** to open the original tweet

### Keyboard Shortcuts

- `⌘K` / `Ctrl+K` - Focus search input
- `Esc` - Clear search

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Tweet Recall Extension                     │
├─────────────────────────────────────────────────────────────┤
│  Content Script (runs on x.com)                              │
│  ├── IntersectionObserver → only captures viewed tweets      │
│  ├── MutationObserver → detects new tweets in DOM            │
│  └── Tweet Parser → extracts structured data                 │
├─────────────────────────────────────────────────────────────┤
│  Background Worker                                           │
│  ├── IndexedDB → local storage (privacy-first)               │
│  ├── MiniSearch → fast full-text search                      │
│  └── Deduplication → tweet ID as primary key                 │
├─────────────────────────────────────────────────────────────┤
│  Popup UI                                                    │
│  ├── Search bar with instant results                         │
│  ├── Tweet previews with metadata                            │
│  └── Settings (export, clear data)                           │
└─────────────────────────────────────────────────────────────┘
```

### Data Stored Per Tweet

```typescript
{
  id: string;           // Tweet ID (deduplication key)
  text: string;         // Full tweet text
  author: string;       // @handle
  authorName: string;   // Display name
  postedAt: number;     // When tweet was posted
  seenAt: number;       // When YOU saw it
  url: string;          // Direct link
  hasMedia: boolean;    // Has images/video
  isRetweet: boolean;   // Is a retweet
  isThread: boolean;    // Part of thread
  quotedText?: string;  // Quoted tweet text
  quotedAuthor?: string;// Quoted tweet author
}
```

### Storage Estimates

- Average tweet: ~500 bytes
- 1000 tweets/day × 30 days = ~15MB
- IndexedDB limit: 50%+ of free disk space

You can store **years of tweet history** locally.

## Tech Stack

- **TypeScript** - Type-safe code
- **Vite + CRXJS** - Fast builds with Chrome extension support
- **MiniSearch** - Lightweight full-text search
- **idb** - Promise-based IndexedDB wrapper

## Privacy

This extension:
- ✅ Stores all data locally in your browser
- ✅ Never sends data to any server
- ✅ Has no analytics or tracking
- ✅ Requires only minimal permissions (activeTab, storage)

## Converting Icons to PNG

The extension needs PNG icons. Convert the SVG files to PNG:

```bash
# Using ImageMagick
convert public/icons/icon16.svg public/icons/icon16.png
convert public/icons/icon48.svg public/icons/icon48.png
convert public/icons/icon128.svg public/icons/icon128.png

# Or use any SVG to PNG converter
```

## License

MIT
