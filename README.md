# Tweet Recall

- [Tweet Recall](#tweet-recall)
  - [Features](#features)
    - [Core Functionality](#core-functionality)
    - [Search \& Discovery](#search--discovery)
    - [Organization](#organization)
    - [Views](#views)
    - [Keyboard Navigation](#keyboard-navigation)
    - [Data Management](#data-management)
  - [Installation (Step-by-Step for Beginners)](#installation-step-by-step-for-beginners)
    - [Prerequisites](#prerequisites)
    - [Step 1: Download the Code](#step-1-download-the-code)
    - [Step 2: Install Dependencies](#step-2-install-dependencies)
    - [Step 3: Build the Extension](#step-3-build-the-extension)
    - [Step 4: Load the Extension in Chrome](#step-4-load-the-extension-in-chrome)
    - [Step 5: Verify Installation](#step-5-verify-installation)
    - [Updating the Extension](#updating-the-extension)
  - [Usage Guide](#usage-guide)
    - [Basic Usage](#basic-usage)
    - [Using Advanced Search](#using-advanced-search)
    - [Using Collections](#using-collections)
    - [Using Favorites](#using-favorites)
  - [How It Works](#how-it-works)
    - [Architecture](#architecture)
    - [Data Stored Per Tweet](#data-stored-per-tweet)
    - [Storage Estimates](#storage-estimates)
  - [Tech Stack](#tech-stack)
  - [Privacy](#privacy)
  - [Troubleshooting](#troubleshooting)
    - [Extension not capturing tweets](#extension-not-capturing-tweets)
    - [Search not returning expected results](#search-not-returning-expected-results)
    - [Extension icon not visible](#extension-icon-not-visible)
  - [Development](#development)
  - [Contributing](#contributing)
  - [License](#license)


**Remember every tweet you've seen. Search your Twitter browsing history.**

A privacy-first Chrome extension that captures tweets as you browse Twitter/X and lets you search, filter, organize, and revisit them later. All data stays local in your browser.

## Features

### Core Functionality
- **Automatic Capture**: Passively captures tweets as you scroll through Twitter/X
- **Smart Viewport Detection**: Only captures tweets you actually see (not prefetched content)
- **Privacy-First**: All data stored locally in IndexedDB - no servers, no accounts, no tracking

### Search & Discovery
- **Instant Full-Text Search**: Search across all tweets with fuzzy matching
- **Advanced Search Operators**:
  - `from:username` - Filter by author
  - `has:media` - Tweets with images/video
  - `is:retweet` - Retweets only
  - `is:thread` - Thread tweets
  - `has:quote` - Quote tweets
  - `before:YYYY-MM-DD` - Tweets seen before a date
  - `after:YYYY-MM-DD` - Tweets seen after a date
- **Browse Mode**: View recent tweets without searching (reverse chronological)

### Organization
- **Favorites**: Star tweets to save them for later
- **Collections**: Create custom collections to organize tweets by topic
- **Filter Chips**: Quick filters for media, retweets, threads, and quote tweets
- **Time Filters**: Today, Last 7 Days, Last 30 Days, All Time

### Views
- **Popup View**: Quick access from the extension icon
- **Fullpage View**: Advanced UI in a dedicated tab with:
  - Sidebar with collections and filters
  - Grid or list view toggle
  - Sort options (Newest, Oldest, By Author)
  - Detailed tweet cards with quoted tweet previews

### Keyboard Navigation
| Key           | Action                |
| ------------- | --------------------- |
| `j` / `↓`     | Select next tweet     |
| `k` / `↑`     | Select previous tweet |
| `Enter` / `o` | Open selected tweet   |
| `s`           | Toggle favorite       |
| `/`           | Focus search input    |
| `Esc`         | Clear selection       |

### Data Management
- **Export**: Download your entire tweet history as JSON
- **Statistics**: See total tweets captured and unique authors
- **Clear Data**: Delete all captured data when needed

---

## Installation

### Quick Install (Recommended)

1. **Download** the latest release from [GitHub Releases](https://github.com/sourav-bhar/tweet-recall/releases)
2. **Unzip** the downloaded file
3. **Open Chrome** and go to `chrome://extensions`
4. **Enable Developer Mode** (toggle in top-right corner)
5. **Click "Load unpacked"** and select the unzipped folder
6. **Done!** You should see Tweet Recall in your extensions

### Build from Source (For Developers)

<details>
<summary>Click to expand build instructions</summary>

#### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- pnpm: `npm install -g pnpm`

#### Steps

```bash
# Clone the repository
git clone https://github.com/sourav-bhar/tweet-recall.git
cd tweet-recall

# Install dependencies
pnpm install

# Build the extension
pnpm build
```

This creates a `dist` folder containing the built extension.

</details>

### Pin the Extension (Recommended)

1. Click the puzzle piece icon in Chrome's toolbar (top-right)
2. Find "Tweet Recall" in the list
3. Click the pin icon to keep it visible

### Verify It Works

1. Go to [twitter.com](https://twitter.com) or [x.com](https://x.com)
2. Scroll through some tweets
3. Click the Tweet Recall extension icon
4. You should see the tweets you just scrolled past!

### Updating

**From releases:** Download the new version, unzip, and click the refresh icon on `chrome://extensions`

**From source:** `git pull && pnpm install && pnpm build`, then refresh on `chrome://extensions`

---

## Usage Guide

### Basic Usage

1. **Browse Twitter/X normally** - tweets are captured automatically as you scroll
2. **Click the extension icon** to open the popup
3. **Search or browse** - see your recent tweets or search for specific ones
4. **Click a tweet** to open it on Twitter/X

### Using Advanced Search

Combine text with operators for powerful searches:

```
from:elonmusk has:media         # Elon's tweets with images/video
AI news after:2024-01-01        # AI tweets seen this year
is:thread machine learning      # Threads about ML
```

### Using Collections

1. **Open Fullpage View**: Click "Open Full View" in the popup or the fullpage icon
2. **Create a Collection**: Click the + button next to "Collections" in the sidebar
3. **Add Tweets**: Click the folder icon on any tweet, then select a collection
4. **View a Collection**: Click on it in the sidebar to filter tweets
5. **Delete a Collection**: Hover over it and click the trash icon

### Using Favorites

- Click the star icon on any tweet to add it to Favorites
- View all favorites by clicking "Favorites" in the sidebar or popup tabs

---

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Tweet Recall Extension                    │
├─────────────────────────────────────────────────────────────┤
│  Content Script (runs on x.com)                             │
│  ├── IntersectionObserver → only captures viewed tweets     │
│  ├── MutationObserver → detects new tweets in DOM           │
│  └── Tweet Parser → extracts structured data                │
├─────────────────────────────────────────────────────────────┤
│  Background Worker                                          │
│  ├── IndexedDB → local storage (privacy-first)              │
│  ├── MiniSearch → fast full-text search                     │
│  ├── Collections → organize tweets into groups              │
│  └── Favorites → star important tweets                      │
├─────────────────────────────────────────────────────────────┤
│  Popup UI                                                   │
│  ├── Browse mode (recent tweets)                            │
│  ├── Search with operators                                  │
│  ├── Favorites tab                                          │
│  └── Filter chips                                           │
├─────────────────────────────────────────────────────────────┤
│  Fullpage UI                                                │
│  ├── Sidebar with collections & filters                     │
│  ├── Grid/list view toggle                                  │
│  ├── Advanced sorting                                       │
│  └── Collection management                                  │
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

---

## Tech Stack

| Component | Technology                    |
| --------- | ----------------------------- |
| Language  | TypeScript (strict mode)      |
| Build     | Vite + @crxjs/vite-plugin     |
| Storage   | IndexedDB via `idb` library   |
| Search    | MiniSearch (full-text, fuzzy) |
| UI        | Vanilla HTML/CSS/TypeScript   |

---

## Privacy

This extension:
- ✅ Stores all data locally in your browser
- ✅ Never sends data to any server
- ✅ Has no analytics or tracking
- ✅ Requires only minimal permissions (activeTab, storage)
- ✅ Open source - you can audit the code yourself

---

## Troubleshooting

### Extension not capturing tweets
- Make sure you're on twitter.com or x.com
- Try refreshing the page after installing
- Check the Chrome DevTools console for errors (F12 on the Twitter page)

### Search not returning expected results
- Tweets must be scrolled into view to be captured
- Try different search terms or operators
- Check if the tweet was captured by browsing recent tweets

### Extension icon not visible
- Click the puzzle piece icon in Chrome's toolbar
- Pin Tweet Recall to make it always visible

---

## Development

```bash
pnpm install    # Install dependencies
pnpm dev        # Development with hot reload
pnpm build      # Production build
```

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT - see [LICENSE](LICENSE) for details.
