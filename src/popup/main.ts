import type {
  ExtensionMessage,
  ExtensionResponse,
  SearchResult,
  TweetStats,
} from "../types";

// DOM Elements
const searchInput = document.getElementById("search-input") as HTMLInputElement;
const resultsContainer = document.getElementById("results") as HTMLDivElement;
const statsText = document.getElementById("stats-text") as HTMLSpanElement;
const settingsBtn = document.getElementById(
  "settings-btn",
) as HTMLButtonElement;
const settingsPanel = document.getElementById(
  "settings-panel",
) as HTMLDivElement;
const closeSettings = document.getElementById(
  "close-settings",
) as HTMLButtonElement;
const exportBtn = document.getElementById("export-btn") as HTMLButtonElement;
const clearBtn = document.getElementById("clear-btn") as HTMLButtonElement;

// Debounce timer
let searchDebounce: ReturnType<typeof setTimeout> | null = null;

/**
 * Send message to background worker
 */
async function sendMessage(
  message: ExtensionMessage,
): Promise<ExtensionResponse> {
  return chrome.runtime.sendMessage(message);
}

/**
 * Format relative time
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

/**
 * Render search results
 */
function renderResults(results: SearchResult[]) {
  if (results.length === 0) {
    resultsContainer.innerHTML = `
      <div class="no-results">
        <p>No tweets found matching your search</p>
      </div>
    `;
    return;
  }

  resultsContainer.innerHTML = results
    .map(
      (tweet) => `
      <a href="${tweet.url}" target="_blank" rel="noopener" class="tweet-item">
        <div class="tweet-header">
          <span class="tweet-author-name">${escapeHtml(tweet.authorName)}</span>
          <span class="tweet-author-handle">@${escapeHtml(tweet.author)}</span>
          <span class="tweet-time">${formatRelativeTime(tweet.seenAt)}</span>
        </div>
        <div class="tweet-text">${escapeHtml(tweet.text)}</div>
        <div class="tweet-meta">
          ${tweet.hasMedia ? '<span class="tweet-badge">📷 Media</span>' : ""}
          ${tweet.isRetweet ? '<span class="tweet-badge">🔁 Retweet</span>' : ""}
          ${tweet.isThread ? '<span class="tweet-badge">🧵 Thread</span>' : ""}
        </div>
      </a>
    `,
    )
    .join("");
}

/**
 * Render empty state
 */
function renderEmptyState() {
  resultsContainer.innerHTML = `
    <div class="empty-state">
      <p>Start typing to search tweets you've seen</p>
    </div>
  `;
}

/**
 * Update stats display
 */
function updateStats(stats: TweetStats) {
  if (stats.totalTweets === 0) {
    statsText.textContent = "No tweets captured yet. Browse Twitter to start!";
  } else {
    const timeRange = stats.oldestTweet
      ? `Since ${formatRelativeTime(stats.oldestTweet)}`
      : "";
    statsText.textContent = `${stats.totalTweets.toLocaleString()} tweets from ${stats.uniqueAuthors.toLocaleString()} authors • ${timeRange}`;
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Perform search
 */
async function performSearch(query: string) {
  if (!query.trim()) {
    renderEmptyState();
    return;
  }

  try {
    const response = await sendMessage({ type: "SEARCH_TWEETS", query });
    if (response.type === "SEARCH_RESULTS") {
      renderResults(response.results);
    }
  } catch (error) {
    console.error("Search failed:", error);
    resultsContainer.innerHTML = `
      <div class="no-results">
        <p>Search failed. Please try again.</p>
      </div>
    `;
  }
}

/**
 * Load initial stats
 */
async function loadStats() {
  try {
    const response = await sendMessage({ type: "GET_STATS" });
    if (response.type === "STATS") {
      updateStats(response.stats);
    }
  } catch (error) {
    console.error("Failed to load stats:", error);
    statsText.textContent = "Unable to load stats";
  }
}

/**
 * Export data as JSON
 */
async function exportData() {
  try {
    const response = await sendMessage({ type: "EXPORT_DATA" });
    if (response.type === "EXPORTED") {
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tweet-recall-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("Export failed:", error);
    alert("Failed to export data");
  }
}

/**
 * Clear all data
 */
async function clearData() {
  if (
    !confirm(
      "Are you sure you want to delete all captured tweets? This cannot be undone.",
    )
  ) {
    return;
  }

  try {
    await sendMessage({ type: "CLEAR_ALL" });
    settingsPanel.classList.add("hidden");
    renderEmptyState();
    loadStats();
  } catch (error) {
    console.error("Clear failed:", error);
    alert("Failed to clear data");
  }
}

// Event listeners
searchInput.addEventListener("input", () => {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    performSearch(searchInput.value);
  }, 150);
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    searchInput.value = "";
    renderEmptyState();
  }
});

settingsBtn.addEventListener("click", () => {
  settingsPanel.classList.remove("hidden");
});

closeSettings.addEventListener("click", () => {
  settingsPanel.classList.add("hidden");
});

exportBtn.addEventListener("click", exportData);
clearBtn.addEventListener("click", clearData);

// Keyboard shortcut (Cmd/Ctrl + K to focus search)
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
});

// Initialize
loadStats();
renderEmptyState();
searchInput.focus();
