import type {
  SearchResult,
  PaginationCursor,
  CapturedTweet,
  TweetFilters,
  Collection,
} from "../types";
import { sendMessage } from "../shared/utils/messaging";
import { formatNumber } from "../shared/utils/formatting";
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
const PAGE_SIZE = 30;
const SEARCH_DEBOUNCE_MS = 200;

// Types
type SortOrder = "newest" | "oldest" | "author";
type ViewMode = "list" | "grid";
type TimeFilter = "all" | "today" | "week" | "month";

interface AppState {
  searchQuery: string;
  parsedQuery: string;
  filters: TweetFilters;
  timeFilter: TimeFilter;
  sortOrder: SortOrder;
  viewMode: ViewMode;
  selectedCollection: string;
  isLoading: boolean;
  hasMore: boolean;
  cursor: PaginationCursor | null;
  tweets: (CapturedTweet | SearchResult)[];
  favoritedIds: Set<string>;
  selectedIndex: number;
  expandedIds: Set<string>;
  collections: Collection[];
  showMedia: boolean;
}

// State
const state: AppState = {
  searchQuery: "",
  parsedQuery: "",
  filters: {},
  timeFilter: "all",
  sortOrder: "newest",
  viewMode: "list",
  selectedCollection: "all",
  isLoading: false,
  hasMore: true,
  cursor: null,
  tweets: [],
  favoritedIds: new Set(),
  selectedIndex: -1,
  expandedIds: new Set(),
  collections: [],
  showMedia: false,
};

// DOM Elements
const searchInput = document.getElementById("search-input") as HTMLInputElement;
const resultsContainer = document.getElementById("results") as HTMLDivElement;
const resultsCount = document.getElementById("results-count") as HTMLSpanElement;
const activeFiltersContainer = document.getElementById(
  "active-filters"
) as HTMLDivElement;
const loadMoreBtn = document.getElementById("load-more-btn") as HTMLButtonElement;
const paginationContainer = document.getElementById("pagination") as HTMLDivElement;
const statTotal = document.getElementById("stat-total") as HTMLSpanElement;
const statAuthors = document.getElementById("stat-authors") as HTMLSpanElement;
const exportBtn = document.getElementById("export-btn") as HTMLButtonElement;
const clearBtn = document.getElementById("clear-btn") as HTMLButtonElement;
const announcements = document.getElementById("announcements") as HTMLDivElement;

// Sort elements
const sortBtn = document.getElementById("sort-btn") as HTMLButtonElement;
const sortMenu = document.getElementById("sort-menu") as HTMLDivElement;
const sortLabel = document.getElementById("sort-label") as HTMLSpanElement;

// View toggle
const viewListBtn = document.getElementById("view-list") as HTMLButtonElement;
const viewGridBtn = document.getElementById("view-grid") as HTMLButtonElement;

// Media toggle
const toggleMediaBtn = document.getElementById("toggle-media") as HTMLButtonElement;

// Collection modal
const collectionModal = document.getElementById("collection-modal") as HTMLDivElement;
const collectionForm = document.getElementById("collection-form") as HTMLFormElement;
const newCollectionBtn = document.getElementById("new-collection-btn") as HTMLButtonElement;
const cancelCollectionBtn = document.getElementById("cancel-collection") as HTMLButtonElement;
const collectionsList = document.getElementById("collections-list") as HTMLDivElement;

// Add to collection modal
const addToCollectionModal = document.getElementById("add-to-collection-modal") as HTMLDivElement;
const addToCollectionList = document.getElementById("add-to-collection-list") as HTMLDivElement;
const cancelAddToCollectionBtn = document.getElementById("cancel-add-to-collection") as HTMLButtonElement;

// Track which tweet is being added to collection
let pendingTweetId: string | null = null;

// Detail panel
const detailPanel = document.getElementById("detail-panel") as HTMLElement;
const closeDetailBtn = document.getElementById("close-detail") as HTMLButtonElement;

// Debounce timer
let searchDebounce: ReturnType<typeof setTimeout> | null = null;

/**
 * Announce message to screen readers
 */
function announce(message: string) {
  announcements.textContent = message;
  setTimeout(() => {
    announcements.textContent = "";
  }, 1000);
}

/**
 * Show loading state
 */
function showLoading() {
  state.isLoading = true;
  loadMoreBtn.disabled = true;
  loadMoreBtn.textContent = "Loading...";
}

/**
 * Hide loading state
 */
function hideLoading() {
  state.isLoading = false;
  loadMoreBtn.disabled = false;
  loadMoreBtn.textContent = "Load More";
}

/**
 * Get time filter date range
 */
function getTimeFilterDate(filter: TimeFilter): number | undefined {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  switch (filter) {
    case "today":
      return now - day;
    case "week":
      return now - 7 * day;
    case "month":
      return now - 30 * day;
    default:
      return undefined;
  }
}

/**
 * Get combined filters based on current state
 */
function getEffectiveFilters(): TweetFilters {
  const baseFilters = { ...state.filters };

  // Add time filter
  const timeFilterDate = getTimeFilterDate(state.timeFilter);
  if (timeFilterDate) {
    baseFilters.seenAfter = timeFilterDate;
  }

  // Add collection filter
  if (state.selectedCollection !== "all") {
    baseFilters.collectionId = state.selectedCollection;
  }

  return baseFilters;
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

      const card = resultsContainer.querySelector(
        `[data-tweet-id="${tweetId}"]`
      ) as HTMLElement | null;
      if (card) {
        updateCardFavoriteState(card, response.isFavorited);
      }

      // If viewing favorites and unfavorited, remove from view
      if (state.selectedCollection === "__favorites__" && !response.isFavorited) {
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

  const index = state.tweets.findIndex((t) => t.id === tweetId);
  if (index >= 0) {
    const oldCard = resultsContainer.querySelector(
      `[data-tweet-id="${tweetId}"]`
    );
    if (oldCard) {
      const newCard = renderTweetCard(state.tweets[index], {
        variant: state.viewMode === "grid" ? "compact" : "expanded",
        showFavorite: true,
        isFavorited: state.favoritedIds.has(tweetId),
        onFavoriteClick: handleFavoriteToggle,
        showAddToCollection: true,
        onAddToCollectionClick: handleAddToCollectionClick,
        isSelected: state.selectedIndex === index,
        isTextExpanded: state.expandedIds.has(tweetId),
        onExpandClick: handleExpandToggle,
        showMedia: state.showMedia,
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
    resultsContainer.className = `results ${state.viewMode === "grid" ? "results--grid" : ""}`;
  }

  if (state.tweets.length === 0 && !append) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <p>No tweets found</p>
        <p style="font-size: 13px;">Try adjusting your search or filters</p>
      </div>
    `;
    resultsCount.textContent = "0 tweets";
    paginationContainer.classList.add("hidden");
    return;
  }

  const fragment = document.createDocumentFragment();
  const startIndex = append
    ? resultsContainer.querySelectorAll(".tweet-card").length
    : 0;

  state.tweets.slice(startIndex).forEach((tweet, i) => {
    const actualIndex = startIndex + i;
    const card = renderTweetCard(tweet, {
      variant: state.viewMode === "grid" ? "compact" : "expanded",
      showFavorite: true,
      isFavorited: state.favoritedIds.has(tweet.id),
      onFavoriteClick: handleFavoriteToggle,
      showAddToCollection: true,
      onAddToCollectionClick: handleAddToCollectionClick,
      isSelected: state.selectedIndex === actualIndex,
      isTextExpanded: state.expandedIds.has(tweet.id),
      onExpandClick: handleExpandToggle,
      showMedia: state.showMedia,
    });

    card.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
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

  // Update results count
  resultsCount.textContent = `${state.tweets.length} tweet${state.tweets.length !== 1 ? "s" : ""}`;

  // Show/hide pagination
  if (state.hasMore) {
    paginationContainer.classList.remove("hidden");
  } else {
    paginationContainer.classList.add("hidden");
  }
}

/**
 * Render active filter chips
 */
function renderActiveFilters() {
  const chips = filtersToChips(state.filters);

  // Add time filter chip if not "all"
  if (state.timeFilter !== "all") {
    const labels: Record<TimeFilter, string> = {
      all: "",
      today: "Today",
      week: "Last 7 days",
      month: "Last 30 days",
    };
    chips.unshift({
      label: labels[state.timeFilter],
      key: "seenAfter",
      value: state.timeFilter,
    });
  }

  if (chips.length === 0) {
    activeFiltersContainer.classList.add("hidden");
    return;
  }

  activeFiltersContainer.classList.remove("hidden");
  activeFiltersContainer.innerHTML = "";

  chips.forEach((chip) => {
    const chipEl = createFilterChip(chip, () => {
      if (chip.key === "seenAfter" && typeof chip.value === "string") {
        // Reset time filter
        state.timeFilter = "all";
        updateTimeFilterUI();
      } else {
        delete state.filters[chip.key];
      }
      renderActiveFilters();
      loadTweets();
    });
    activeFiltersContainer.appendChild(chipEl);
  });
}

/**
 * Load tweets
 */
async function loadTweets() {
  showLoading();
  state.cursor = null;
  state.hasMore = true;
  state.tweets = [];
  state.selectedIndex = -1;

  const effectiveFilters = getEffectiveFilters();
  const hasTextQuery = state.parsedQuery.trim().length > 0;
  const hasFilters = Object.keys(effectiveFilters).length > 0;

  try {
    if (hasTextQuery || hasFilters) {
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
        await loadFavoriteStates(state.tweets.map((t) => t.id));
      }
    } else {
      const response = await sendMessage({
        type: "BROWSE_TWEETS",
        filters: effectiveFilters,
        limit: PAGE_SIZE,
      });

      if (response.type === "BROWSE_RESULTS") {
        state.tweets = response.data.items;
        state.cursor = response.data.nextCursor;
        state.hasMore = response.data.hasMore;
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
      <div class="empty-state">
        <p>Failed to load tweets</p>
        <p style="font-size: 13px;">Please try again</p>
      </div>
    `;
  } finally {
    hideLoading();
  }
}

/**
 * Load more tweets
 */
async function loadMore() {
  if (state.isLoading || !state.hasMore || !state.cursor) return;

  showLoading();

  const effectiveFilters = getEffectiveFilters();
  const hasTextQuery = state.parsedQuery.trim().length > 0;
  const hasFilters = Object.keys(effectiveFilters).length > 0;

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
      }
    }
  } catch (error) {
    console.error("Failed to load more:", error);
  } finally {
    hideLoading();
  }
}

/**
 * Load favorite states for tweet IDs
 */
async function loadFavoriteStates(tweetIds: string[]) {
  for (const id of tweetIds) {
    try {
      const response = await sendMessage({ type: "IS_FAVORITED", tweetId: id });
      if (response.type === "IS_FAVORITED_RESULT" && response.isFavorited) {
        state.favoritedIds.add(id);
      }
    } catch {
      // Ignore
    }
  }
}

/**
 * Perform search
 */
function performSearch(query: string) {
  state.searchQuery = query;
  const { query: parsedQuery, filters: parsedFilters } = parseSearchQuery(query);
  state.parsedQuery = parsedQuery;
  state.filters = mergeFilters(state.filters, parsedFilters);
  renderActiveFilters();
  loadTweets();
}

/**
 * Load stats
 */
async function loadStats() {
  try {
    const response = await sendMessage({ type: "GET_STATS" });
    if (response.type === "STATS") {
      statTotal.textContent = formatNumber(response.stats.totalTweets);
      statAuthors.textContent = formatNumber(response.stats.uniqueAuthors);
    }
  } catch (error) {
    console.error("Failed to load stats:", error);
  }
}

/**
 * Load collections
 */
async function loadCollections() {
  try {
    const response = await sendMessage({ type: "GET_COLLECTIONS" });
    if (response.type === "COLLECTIONS") {
      state.collections = response.collections;
      renderCollections();
    }
  } catch (error) {
    console.error("Failed to load collections:", error);
  }
}

/**
 * Render collections in sidebar
 */
function renderCollections() {
  // Remove dynamic collections (keep "All Tweets" and "Favorites")
  collectionsList.querySelectorAll("[data-collection]:not([data-collection='all']):not([data-collection='__favorites__'])").forEach((el) => el.remove());

  // Add custom collections
  state.collections
    .filter((c) => !c.isBuiltIn)
    .forEach((collection) => {
      const btn = document.createElement("button");
      btn.className = `sidebar__collection ${state.selectedCollection === collection.id ? "active" : ""}`;
      btn.setAttribute("data-collection", collection.id);
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${collection.color || "currentColor"}" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <span>${collection.name}</span>
        <span class="sidebar__collection-delete" title="Delete collection" data-delete-collection="${collection.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </span>
      `;

      // Handle click on collection name
      btn.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        // Don't select if clicking delete button
        if (target.closest(".sidebar__collection-delete")) {
          return;
        }
        selectCollection(collection.id);
      });

      // Handle delete button click
      const deleteBtn = btn.querySelector(".sidebar__collection-delete");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          deleteCollection(collection.id);
        });
      }

      collectionsList.appendChild(btn);
    });
}

/**
 * Select a collection
 */
function selectCollection(collectionId: string) {
  state.selectedCollection = collectionId;

  // Update UI
  collectionsList.querySelectorAll(".sidebar__collection").forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.getAttribute("data-collection") === collectionId
    );
  });

  loadTweets();
}

/**
 * Update time filter UI
 */
function updateTimeFilterUI() {
  document.querySelectorAll(".sidebar__option[data-filter]").forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.getAttribute("data-filter") === state.timeFilter
    );
  });
}

/**
 * Export data
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
      announce("Data exported");
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
  if (!confirm("Delete all captured tweets? This cannot be undone.")) {
    return;
  }

  try {
    await sendMessage({ type: "CLEAR_ALL" });
    state.tweets = [];
    state.favoritedIds.clear();
    renderResults(false);
    loadStats();
    announce("All data cleared");
  } catch (error) {
    console.error("Clear failed:", error);
    alert("Failed to clear data");
  }
}

/**
 * Create new collection
 */
async function createCollection(name: string, description: string, color: string) {
  try {
    const response = await sendMessage({
      type: "CREATE_COLLECTION",
      name,
      description: description || undefined,
      color,
    });

    if (response.type === "COLLECTION_CREATED") {
      state.collections.push(response.collection);
      renderCollections();
      closeModal();
      announce(`Collection "${name}" created`);
    }
  } catch (error) {
    console.error("Failed to create collection:", error);
    alert("Failed to create collection");
  }
}

/**
 * Delete a collection
 */
async function deleteCollection(collectionId: string) {
  const collection = state.collections.find((c) => c.id === collectionId);
  if (!collection) return;

  if (!confirm(`Delete collection "${collection.name}"? Tweets will not be deleted.`)) {
    return;
  }

  try {
    const response = await sendMessage({
      type: "DELETE_COLLECTION",
      id: collectionId,
    });

    if (response.type === "COLLECTION_DELETED") {
      state.collections = state.collections.filter((c) => c.id !== collectionId);
      renderCollections();

      // If we were viewing this collection, switch to "all"
      if (state.selectedCollection === collectionId) {
        selectCollection("all");
      }

      announce(`Collection "${collection.name}" deleted`);
    }
  } catch (error) {
    console.error("Failed to delete collection:", error);
    alert("Failed to delete collection");
  }
}

/**
 * Open add to collection modal
 */
function openAddToCollectionModal(tweetId: string) {
  pendingTweetId = tweetId;

  // Render collection options
  const customCollections = state.collections.filter((c) => !c.isBuiltIn);

  if (customCollections.length === 0) {
    addToCollectionList.innerHTML = `
      <div class="collection-select-empty">
        <p>No collections yet</p>
        <p style="font-size: 13px;">Create a collection first using the sidebar</p>
      </div>
    `;
  } else {
    addToCollectionList.innerHTML = "";
    customCollections.forEach((collection) => {
      const item = document.createElement("button");
      item.className = "collection-select-item";
      item.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${collection.color || "currentColor"}" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <span class="collection-select-item__name">${collection.name}</span>
        <svg class="collection-select-item__check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      `;
      item.addEventListener("click", () => addTweetToCollection(collection.id));
      addToCollectionList.appendChild(item);
    });
  }

  addToCollectionModal.classList.remove("hidden");
}

/**
 * Close add to collection modal
 */
function closeAddToCollectionModal() {
  addToCollectionModal.classList.add("hidden");
  pendingTweetId = null;
}

/**
 * Add tweet to collection
 */
async function addTweetToCollection(collectionId: string) {
  if (!pendingTweetId) return;

  const tweetId = pendingTweetId;
  const collection = state.collections.find((c) => c.id === collectionId);

  try {
    const response = await sendMessage({
      type: "ADD_TO_COLLECTION",
      collectionId,
      tweetId,
    });

    if (response.type === "ADDED_TO_COLLECTION") {
      closeAddToCollectionModal();
      announce(`Added to "${collection?.name || "collection"}"`);
    }
  } catch (error) {
    console.error("Failed to add to collection:", error);
    alert("Failed to add to collection");
  }
}

/**
 * Handle add to collection click
 */
function handleAddToCollectionClick(tweetId: string, event: Event) {
  event.stopPropagation();
  openAddToCollectionModal(tweetId);
}

/**
 * Open modal
 */
function openModal() {
  collectionModal.classList.remove("hidden");
}

/**
 * Close modal
 */
function closeModal() {
  collectionModal.classList.add("hidden");
  collectionForm.reset();
}

/**
 * Handle keyboard navigation
 */
function handleKeydown(e: KeyboardEvent) {
  if (document.activeElement === searchInput) {
    if (e.key === "Escape") {
      searchInput.blur();
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
      detailPanel.classList.add("hidden");
      break;

    case "/":
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
      break;
  }
}

/**
 * Select tweet by index
 */
function selectTweet(index: number) {
  const cards = resultsContainer.querySelectorAll(".tweet-card");

  if (state.selectedIndex >= 0 && state.selectedIndex < cards.length) {
    updateCardSelectedState(cards[state.selectedIndex] as HTMLElement, false);
  }

  state.selectedIndex = index;

  if (index >= 0 && index < cards.length) {
    const card = cards[index] as HTMLElement;
    updateCardSelectedState(card, true);
    card.focus();
    card.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

// Event Listeners

// Search
searchInput.addEventListener("input", () => {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    performSearch(searchInput.value);
  }, SEARCH_DEBOUNCE_MS);
});

// Load more
loadMoreBtn.addEventListener("click", loadMore);

// Time filters
document.querySelectorAll(".sidebar__option[data-filter]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.timeFilter = btn.getAttribute("data-filter") as TimeFilter;
    updateTimeFilterUI();
    renderActiveFilters();
    loadTweets();
  });
});

// Type filters (checkboxes)
document.getElementById("filter-media")?.addEventListener("change", (e) => {
  const checked = (e.target as HTMLInputElement).checked;
  if (checked) {
    state.filters.hasMedia = true;
  } else {
    delete state.filters.hasMedia;
  }
  renderActiveFilters();
  loadTweets();
});

document.getElementById("filter-retweet")?.addEventListener("change", (e) => {
  const checked = (e.target as HTMLInputElement).checked;
  if (checked) {
    state.filters.isRetweet = true;
  } else {
    delete state.filters.isRetweet;
  }
  renderActiveFilters();
  loadTweets();
});

document.getElementById("filter-thread")?.addEventListener("change", (e) => {
  const checked = (e.target as HTMLInputElement).checked;
  if (checked) {
    state.filters.isThread = true;
  } else {
    delete state.filters.isThread;
  }
  renderActiveFilters();
  loadTweets();
});

document.getElementById("filter-quote")?.addEventListener("change", (e) => {
  const checked = (e.target as HTMLInputElement).checked;
  if (checked) {
    state.filters.isQuoteTweet = true;
  } else {
    delete state.filters.isQuoteTweet;
  }
  renderActiveFilters();
  loadTweets();
});

// Sort dropdown
sortBtn.addEventListener("click", () => {
  sortMenu.classList.toggle("hidden");
});

document.querySelectorAll(".sort-option").forEach((btn) => {
  btn.addEventListener("click", () => {
    const sort = btn.getAttribute("data-sort") as SortOrder;
    state.sortOrder = sort;

    document.querySelectorAll(".sort-option").forEach((b) => {
      b.classList.toggle("active", b === btn);
    });

    sortLabel.textContent = btn.textContent || "Newest First";
    sortMenu.classList.add("hidden");
    loadTweets();
  });
});

// Close sort menu when clicking outside
document.addEventListener("click", (e) => {
  if (!sortBtn.contains(e.target as Node) && !sortMenu.contains(e.target as Node)) {
    sortMenu.classList.add("hidden");
  }
});

// View toggle
viewListBtn.addEventListener("click", () => {
  state.viewMode = "list";
  viewListBtn.classList.add("active");
  viewGridBtn.classList.remove("active");
  renderResults(false);
});

viewGridBtn.addEventListener("click", () => {
  state.viewMode = "grid";
  viewGridBtn.classList.add("active");
  viewListBtn.classList.remove("active");
  renderResults(false);
});

// Media toggle
toggleMediaBtn.addEventListener("click", () => {
  state.showMedia = !state.showMedia;
  toggleMediaBtn.classList.toggle("active", state.showMedia);
  toggleMediaBtn.title = state.showMedia ? "Hide images" : "Show images";
  renderResults(false);
});

// Collections
document.querySelector("[data-collection='all']")?.addEventListener("click", () => {
  selectCollection("all");
});

document.querySelector("[data-collection='__favorites__']")?.addEventListener("click", () => {
  selectCollection("__favorites__");
});

// New collection
newCollectionBtn.addEventListener("click", openModal);
cancelCollectionBtn.addEventListener("click", closeModal);

collectionModal.querySelector(".modal__backdrop")?.addEventListener("click", closeModal);

collectionForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const nameInput = document.getElementById("collection-name") as HTMLInputElement;
  const descInput = document.getElementById("collection-description") as HTMLInputElement;
  const colorBtn = collectionForm.querySelector(".color-option.selected") as HTMLButtonElement;

  createCollection(
    nameInput.value,
    descInput.value,
    colorBtn?.getAttribute("data-color") || "#1d9bf0"
  );
});

// Color picker
collectionForm.querySelectorAll(".color-option").forEach((btn) => {
  btn.addEventListener("click", () => {
    collectionForm.querySelectorAll(".color-option").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
  });
});

// Export/Clear
exportBtn.addEventListener("click", exportData);
clearBtn.addEventListener("click", clearData);

// Add to collection modal
cancelAddToCollectionBtn.addEventListener("click", closeAddToCollectionModal);
addToCollectionModal.querySelector(".modal__backdrop")?.addEventListener("click", closeAddToCollectionModal);

// Detail panel
closeDetailBtn.addEventListener("click", () => {
  detailPanel.classList.add("hidden");
});

// Keyboard navigation
document.addEventListener("keydown", handleKeydown);

// Initialize
async function init() {
  await Promise.all([loadStats(), loadCollections()]);
  await loadTweets();
  searchInput.focus();
}

init();
