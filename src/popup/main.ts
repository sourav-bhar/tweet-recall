import type {
  SearchResult,
  TweetStats,
  PaginationCursor,
  CapturedTweet,
  TweetFilters,
} from "../types";
import { sendMessage } from "../shared/utils/messaging";
import { formatRelativeTime, formatNumber } from "../shared/utils/formatting";
import {
  renderTweetCard,
  updateCardFavoriteState,
  updateCardSelectedState,
} from "../shared/components/TweetCard";
import {
  parseSearchQuery,
  mergeFilters,
} from "../shared/utils/searchOperators";
import {
  filtersToChips,
  createFilterChip,
} from "../shared/components/FilterChips";

// Constants
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 150;

// Types
type ViewMode = "recent" | "favorites";

interface AppState {
  viewMode: ViewMode;
  searchQuery: string;
  parsedQuery: string;
  filters: TweetFilters;
  isLoading: boolean;
  hasMore: boolean;
  cursor: PaginationCursor | null;
  tweets: (CapturedTweet | SearchResult)[];
  favoritedIds: Set<string>;
  selectedIndex: number;
  expandedIds: Set<string>;
}

// State
const state: AppState = {
  viewMode: "recent",
  searchQuery: "",
  parsedQuery: "",
  filters: {},
  isLoading: false,
  hasMore: true,
  cursor: null,
  tweets: [],
  favoritedIds: new Set(),
  selectedIndex: -1,
  expandedIds: new Set(),
};

// DOM Elements
const searchInput = document.getElementById("search-input") as HTMLInputElement;
const resultsContainer = document.getElementById("results") as HTMLDivElement;
const statsText = document.getElementById("stats-text") as HTMLSpanElement;
const settingsBtn = document.getElementById(
  "settings-btn"
) as HTMLButtonElement;
const settingsPanel = document.getElementById(
  "settings-panel"
) as HTMLDivElement;
const closeSettings = document.getElementById(
  "close-settings"
) as HTMLButtonElement;
const exportBtn = document.getElementById("export-btn") as HTMLButtonElement;
const clearBtn = document.getElementById("clear-btn") as HTMLButtonElement;
const fullpageBtn = document.getElementById("fullpage-btn") as HTMLButtonElement;
const loadingIndicator = document.getElementById(
  "loading-indicator"
) as HTMLDivElement;
const tabRecent = document.getElementById("tab-recent") as HTMLButtonElement;
const tabFavorites = document.getElementById(
  "tab-favorites"
) as HTMLButtonElement;
const announcements = document.getElementById(
  "announcements"
) as HTMLDivElement;
const filterRow = document.getElementById("filter-row") as HTMLDivElement;
const activeFiltersContainer = document.getElementById(
  "active-filters"
) as HTMLDivElement;

// Debounce timer
let searchDebounce: ReturnType<typeof setTimeout> | null = null;

// IntersectionObserver for infinite scroll
let scrollObserver: IntersectionObserver | null = null;

/**
 * Announce message to screen readers
 */
function announce(message: string) {
  announcements.textContent = message;
  // Clear after a short delay to allow repeated announcements
  setTimeout(() => {
    announcements.textContent = "";
  }, 1000);
}

/**
 * Show loading indicator
 */
function showLoading() {
  state.isLoading = true;
  loadingIndicator.classList.remove("hidden");
}

/**
 * Hide loading indicator
 */
function hideLoading() {
  state.isLoading = false;
  loadingIndicator.classList.add("hidden");
}

/**
 * Handle favorite toggle
 */
async function handleFavoriteToggle(tweetId: string, event: Event) {
  event.stopPropagation();

  try {
    const response = await sendMessage({ type: "TOGGLE_FAVORITE", tweetId });
    if (response.type === "FAVORITE_TOGGLED") {
      if (response.isFavorited) {
        state.favoritedIds.add(tweetId);
        announce("Added to favorites");
      } else {
        state.favoritedIds.delete(tweetId);
        announce("Removed from favorites");
      }

      // Update UI
      const card = resultsContainer.querySelector(
        `[data-tweet-id="${tweetId}"]`
      ) as HTMLElement | null;
      if (card) {
        updateCardFavoriteState(card, response.isFavorited);
      }

      // If in favorites view and unfavorited, remove the card
      if (state.viewMode === "favorites" && !response.isFavorited) {
        state.tweets = state.tweets.filter((t) => t.id !== tweetId);
        renderResults(false);
      }
    }
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
    announce("Failed to update favorite");
  }
}

/**
 * Handle text expand toggle
 */
function handleExpandToggle(tweetId: string, _event: Event) {
  if (state.expandedIds.has(tweetId)) {
    state.expandedIds.delete(tweetId);
  } else {
    state.expandedIds.add(tweetId);
  }

  // Re-render the specific card
  const index = state.tweets.findIndex((t) => t.id === tweetId);
  if (index >= 0) {
    const oldCard = resultsContainer.querySelector(
      `[data-tweet-id="${tweetId}"]`
    );
    if (oldCard) {
      const newCard = renderTweetCard(state.tweets[index], {
        variant: "compact",
        showFavorite: true,
        isFavorited: state.favoritedIds.has(tweetId),
        onFavoriteClick: handleFavoriteToggle,
        isSelected: state.selectedIndex === index,
        isTextExpanded: state.expandedIds.has(tweetId),
        onExpandClick: handleExpandToggle,
      });
      oldCard.replaceWith(newCard);
    }
  }
}

/**
 * Render tweet results
 */
function renderResults(append = false) {
  if (!append) {
    resultsContainer.innerHTML = "";
  }

  if (state.tweets.length === 0 && !append) {
    if (state.searchQuery) {
      resultsContainer.innerHTML = `
        <div class="no-results">
          <p>No tweets found matching "${state.searchQuery}"</p>
        </div>
      `;
    } else if (state.viewMode === "favorites") {
      resultsContainer.innerHTML = `
        <div class="empty-state">
          <p>No favorited tweets yet</p>
          <p style="margin-top: 8px; font-size: 13px;">Star tweets to add them to your favorites</p>
        </div>
      `;
    } else {
      resultsContainer.innerHTML = `
        <div class="empty-state">
          <p>No tweets captured yet</p>
          <p style="margin-top: 8px; font-size: 13px;">Browse Twitter to start capturing tweets</p>
        </div>
      `;
    }
    return;
  }

  const fragment = document.createDocumentFragment();
  const startIndex = append
    ? resultsContainer.querySelectorAll(".tweet-card").length
    : 0;

  state.tweets.slice(startIndex).forEach((tweet, i) => {
    const actualIndex = startIndex + i;
    const card = renderTweetCard(tweet, {
      variant: "compact",
      showFavorite: true,
      isFavorited: state.favoritedIds.has(tweet.id),
      onFavoriteClick: handleFavoriteToggle,
      isSelected: state.selectedIndex === actualIndex,
      isTextExpanded: state.expandedIds.has(tweet.id),
      onExpandClick: handleExpandToggle,
    });

    // Make card clickable to open tweet
    card.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      // Don't navigate if clicking on buttons or links
      if (
        target.closest("button") ||
        target.closest("a") ||
        target.tagName === "BUTTON" ||
        target.tagName === "A"
      ) {
        return;
      }
      window.open(tweet.url, "_blank", "noopener");
    });

    fragment.appendChild(card);
  });

  resultsContainer.appendChild(fragment);

  // Set up intersection observer for the last item
  setupScrollObserver();
}

/**
 * Setup intersection observer for infinite scroll
 */
function setupScrollObserver() {
  // Clean up existing observer
  if (scrollObserver) {
    scrollObserver.disconnect();
  }

  if (!state.hasMore || state.isLoading) return;

  const lastCard = resultsContainer.querySelector(
    ".tweet-card:last-child"
  ) as HTMLElement | null;
  if (!lastCard) return;

  scrollObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && state.hasMore && !state.isLoading) {
        loadMore();
      }
    },
    { rootMargin: "100px" }
  );

  scrollObserver.observe(lastCard);
}

/**
 * Get combined filters based on current state
 */
function getEffectiveFilters(): TweetFilters {
  const baseFilters = { ...state.filters };

  // Add favorites filter if in favorites mode
  if (state.viewMode === "favorites") {
    baseFilters.collectionId = "__favorites__";
  }

  return baseFilters;
}

/**
 * Load tweets (initial or search)
 */
async function loadTweets() {
  showLoading();
  state.cursor = null;
  state.hasMore = true;
  state.tweets = [];
  state.selectedIndex = -1;

  const effectiveFilters = getEffectiveFilters();
  const hasTextQuery = state.parsedQuery.trim().length > 0;
  const hasFilters = Object.keys(state.filters).length > 0;

  try {
    if (hasTextQuery || hasFilters) {
      // Search/filter mode
      const response = await sendMessage({
        type: "SEARCH_WITH_FILTERS",
        query: state.parsedQuery,
        filters: effectiveFilters,
        limit: PAGE_SIZE,
      });

      if (response.type === "SEARCH_FILTER_RESULTS") {
        state.tweets = response.data.items;
        state.cursor = response.data.nextCursor;
        state.hasMore = response.data.hasMore;

        // Load favorite states
        await loadFavoriteStates(state.tweets.map((t) => t.id));
      }
    } else {
      // Browse mode (no search, no filters)
      const response = await sendMessage({
        type: "BROWSE_TWEETS",
        filters: effectiveFilters,
        limit: PAGE_SIZE,
      });

      if (response.type === "BROWSE_RESULTS") {
        state.tweets = response.data.items;
        state.cursor = response.data.nextCursor;
        state.hasMore = response.data.hasMore;

        // Load favorite states
        await loadFavoriteStates(state.tweets.map((t) => t.id));
      }
    }

    renderResults(false);
    announce(
      state.tweets.length > 0
        ? `${state.tweets.length} tweets loaded`
        : "No tweets found"
    );
  } catch (error) {
    console.error("Failed to load tweets:", error);
    resultsContainer.innerHTML = `
      <div class="no-results">
        <p>Failed to load tweets. Please try again.</p>
      </div>
    `;
  } finally {
    hideLoading();
  }
}

/**
 * Load more tweets (pagination)
 */
async function loadMore() {
  if (state.isLoading || !state.hasMore || !state.cursor) return;

  showLoading();

  const effectiveFilters = getEffectiveFilters();
  const hasTextQuery = state.parsedQuery.trim().length > 0;
  const hasFilters = Object.keys(state.filters).length > 0;

  try {
    if (hasTextQuery || hasFilters) {
      const response = await sendMessage({
        type: "SEARCH_WITH_FILTERS",
        query: state.parsedQuery,
        filters: effectiveFilters,
        cursor: state.cursor,
        limit: PAGE_SIZE,
      });

      if (response.type === "SEARCH_FILTER_RESULTS") {
        const newTweets = response.data.items;
        state.tweets = [...state.tweets, ...newTweets];
        state.cursor = response.data.nextCursor;
        state.hasMore = response.data.hasMore;

        await loadFavoriteStates(newTweets.map((t: SearchResult) => t.id));
        renderResults(true);
        announce(`${newTweets.length} more tweets loaded`);
      }
    } else {
      const response = await sendMessage({
        type: "BROWSE_TWEETS",
        filters: effectiveFilters,
        cursor: state.cursor,
        limit: PAGE_SIZE,
      });

      if (response.type === "BROWSE_RESULTS") {
        const newTweets = response.data.items;
        state.tweets = [...state.tweets, ...newTweets];
        state.cursor = response.data.nextCursor;
        state.hasMore = response.data.hasMore;

        await loadFavoriteStates(newTweets.map((t: CapturedTweet) => t.id));
        renderResults(true);
        announce(`${newTweets.length} more tweets loaded`);
      }
    }
  } catch (error) {
    console.error("Failed to load more tweets:", error);
  } finally {
    hideLoading();
  }
}

/**
 * Load favorite states for a batch of tweet IDs
 */
async function loadFavoriteStates(tweetIds: string[]) {
  for (const id of tweetIds) {
    try {
      const response = await sendMessage({ type: "IS_FAVORITED", tweetId: id });
      if (response.type === "IS_FAVORITED_RESULT" && response.isFavorited) {
        state.favoritedIds.add(id);
      }
    } catch {
      // Ignore errors for individual favorite checks
    }
  }
}

/**
 * Perform search
 */
function performSearch(query: string) {
  state.searchQuery = query;

  // Parse search operators from query
  const { query: parsedQuery, filters: parsedFilters } = parseSearchQuery(query);
  state.parsedQuery = parsedQuery;

  // Merge parsed filters with any manually set filters
  state.filters = mergeFilters(state.filters, parsedFilters);

  // Render active filter chips
  renderActiveFilters();

  loadTweets();
}

/**
 * Render active filter chips
 */
function renderActiveFilters() {
  const chips = filtersToChips(state.filters);

  if (chips.length === 0) {
    filterRow.classList.add("hidden");
    return;
  }

  filterRow.classList.remove("hidden");
  activeFiltersContainer.innerHTML = "";

  chips.forEach((chip) => {
    const chipEl = createFilterChip(chip, () => removeFilter(chip.key));
    activeFiltersContainer.appendChild(chipEl);
  });
}

/**
 * Remove a filter by key
 */
function removeFilter(key: keyof TweetFilters) {
  delete state.filters[key];

  // Also remove the operator from the search input if present
  const operatorPatterns: Record<string, RegExp> = {
    author: /from:@?\S+\s*/gi,
    hasMedia: /has:(media|image|video)\s*/gi,
    isRetweet: /is:(retweet|rt)\s*/gi,
    isThread: /is:thread\s*/gi,
    isQuoteTweet: /has:(quote|quoted)\s*/gi,
    seenAfter: /after:\S+\s*/gi,
    seenBefore: /before:\S+\s*/gi,
  };

  if (key in operatorPatterns) {
    searchInput.value = searchInput.value
      .replace(operatorPatterns[key], "")
      .trim();
    state.searchQuery = searchInput.value;
    state.parsedQuery = searchInput.value;
  }

  renderActiveFilters();
  loadTweets();
}

/**
 * Switch view tab
 */
function switchTab(tab: ViewMode) {
  if (state.viewMode === tab) return;

  state.viewMode = tab;

  // Update tab UI
  tabRecent.classList.toggle("active", tab === "recent");
  tabFavorites.classList.toggle("active", tab === "favorites");

  // Reload tweets
  loadTweets();
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
    statsText.textContent = `${formatNumber(stats.totalTweets)} tweets from ${formatNumber(stats.uniqueAuthors)} authors • ${timeRange}`;
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
      announce("Data exported successfully");
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
      "Are you sure you want to delete all captured tweets? This cannot be undone."
    )
  ) {
    return;
  }

  try {
    await sendMessage({ type: "CLEAR_ALL" });
    settingsPanel.classList.add("hidden");
    state.tweets = [];
    state.favoritedIds.clear();
    state.cursor = null;
    state.hasMore = false;
    renderResults(false);
    loadStats();
    announce("All data cleared");
  } catch (error) {
    console.error("Clear failed:", error);
    alert("Failed to clear data");
  }
}

/**
 * Open fullpage view
 */
function openFullpage() {
  chrome.tabs.create({ url: chrome.runtime.getURL("src/fullpage/index.html") });
}

/**
 * Handle keyboard navigation
 */
function handleKeydown(e: KeyboardEvent) {
  // Don't interfere if typing in input
  if (document.activeElement === searchInput) {
    if (e.key === "Escape") {
      searchInput.value = "";
      state.searchQuery = "";
      loadTweets();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      searchInput.blur();
      selectTweet(0);
    }
    return;
  }

  const cards = resultsContainer.querySelectorAll(".tweet-card");

  switch (e.key) {
    case "j":
    case "ArrowDown":
      e.preventDefault();
      selectTweet(Math.min(state.selectedIndex + 1, cards.length - 1));
      break;

    case "k":
    case "ArrowUp":
      e.preventDefault();
      selectTweet(Math.max(state.selectedIndex - 1, 0));
      break;

    case "Enter":
    case "o":
      if (state.selectedIndex >= 0 && state.tweets[state.selectedIndex]) {
        window.open(state.tweets[state.selectedIndex].url, "_blank", "noopener");
      }
      break;

    case "s":
      if (state.selectedIndex >= 0 && state.tweets[state.selectedIndex]) {
        handleFavoriteToggle(
          state.tweets[state.selectedIndex].id,
          new Event("keypress")
        );
      }
      break;

    case "Escape":
      selectTweet(-1);
      searchInput.focus();
      break;

    case "/":
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
      break;
  }
}

/**
 * Select a tweet by index
 */
function selectTweet(index: number) {
  const cards = resultsContainer.querySelectorAll(".tweet-card");

  // Deselect previous
  if (state.selectedIndex >= 0 && state.selectedIndex < cards.length) {
    updateCardSelectedState(cards[state.selectedIndex] as HTMLElement, false);
  }

  state.selectedIndex = index;

  // Select new
  if (index >= 0 && index < cards.length) {
    const card = cards[index] as HTMLElement;
    updateCardSelectedState(card, true);
    card.focus();
    card.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

// Event listeners
searchInput.addEventListener("input", () => {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    performSearch(searchInput.value);
  }, SEARCH_DEBOUNCE_MS);
});

tabRecent.addEventListener("click", () => switchTab("recent"));
tabFavorites.addEventListener("click", () => switchTab("favorites"));

settingsBtn.addEventListener("click", () => {
  settingsPanel.classList.remove("hidden");
});

closeSettings.addEventListener("click", () => {
  settingsPanel.classList.add("hidden");
});

exportBtn.addEventListener("click", exportData);
clearBtn.addEventListener("click", clearData);
fullpageBtn.addEventListener("click", openFullpage);

// Keyboard shortcut (Cmd/Ctrl + K to focus search)
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
    return;
  }

  handleKeydown(e);
});

// Initialize
async function init() {
  await loadStats();
  await loadTweets();
  searchInput.focus();
}

init();
