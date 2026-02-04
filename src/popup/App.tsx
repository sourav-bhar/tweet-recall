import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Settings,
  ExternalLink,
  Download,
  Trash2,
  Star,
  Loader2,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TweetCard } from "@/components/TweetCard";
import { sendMessage } from "@/shared/utils/messaging";
import { formatRelativeTime, formatNumber } from "@/shared/utils/formatting";
import { parseSearchQuery, mergeFilters } from "@/shared/utils/searchOperators";
import type {
  CapturedTweet,
  SearchResult,
  TweetStats,
  TweetFilters,
  PaginationCursor,
} from "@/types";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 150;

type ViewMode = "recent" | "favorites";

export function App() {
  // Theme
  const { theme, setTheme } = useTheme();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [parsedQuery, setParsedQuery] = useState("");
  const [filters, setFilters] = useState<TweetFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<PaginationCursor | null>(null);
  const [tweets, setTweets] = useState<(CapturedTweet | SearchResult)[]>([]);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<TweetStats | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load stats on mount
  useEffect(() => {
    loadStats();
    loadTweets();
    searchInputRef.current?.focus();
  }, []);

  // Load tweets when viewMode changes
  useEffect(() => {
    loadTweets();
  }, [viewMode]);

  const loadStats = async () => {
    try {
      const response = await sendMessage({ type: "GET_STATS" });
      if (response.type === "STATS") {
        setStats(response.stats);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const getEffectiveFilters = useCallback((): TweetFilters => {
    const baseFilters = { ...filters };
    if (viewMode === "favorites") {
      baseFilters.collectionId = "__favorites__";
    }
    return baseFilters;
  }, [filters, viewMode]);

  const loadFavoriteStates = async (tweetIds: string[]) => {
    const newFavorited = new Set(favoritedIds);
    for (const id of tweetIds) {
      try {
        const response = await sendMessage({
          type: "IS_FAVORITED",
          tweetId: id,
        });
        if (response.type === "IS_FAVORITED_RESULT" && response.isFavorited) {
          newFavorited.add(id);
        }
      } catch {
        // Ignore errors
      }
    }
    setFavoritedIds(newFavorited);
  };

  const loadTweets = async () => {
    setIsLoading(true);
    setCursor(null);
    setHasMore(true);
    setTweets([]);
    setSelectedIndex(-1);

    const effectiveFilters = getEffectiveFilters();
    const hasTextQuery = parsedQuery.trim().length > 0;
    const hasFilters = Object.keys(filters).length > 0;

    try {
      if (hasTextQuery || hasFilters) {
        const response = await sendMessage({
          type: "SEARCH_WITH_FILTERS",
          query: parsedQuery,
          filters: effectiveFilters,
          limit: PAGE_SIZE,
        });

        if (response.type === "SEARCH_FILTER_RESULTS") {
          setTweets(response.data.items);
          setCursor(response.data.nextCursor);
          setHasMore(response.data.hasMore);
          await loadFavoriteStates(response.data.items.map((t) => t.id));
        }
      } else {
        const response = await sendMessage({
          type: "BROWSE_TWEETS",
          filters: effectiveFilters,
          limit: PAGE_SIZE,
        });

        if (response.type === "BROWSE_RESULTS") {
          setTweets(response.data.items);
          setCursor(response.data.nextCursor);
          setHasMore(response.data.hasMore);
          await loadFavoriteStates(response.data.items.map((t) => t.id));
        }
      }
    } catch (error) {
      console.error("Failed to load tweets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    if (isLoading || !hasMore || !cursor) return;

    setIsLoading(true);
    const effectiveFilters = getEffectiveFilters();
    const hasTextQuery = parsedQuery.trim().length > 0;
    const hasFilters = Object.keys(filters).length > 0;

    try {
      if (hasTextQuery || hasFilters) {
        const response = await sendMessage({
          type: "SEARCH_WITH_FILTERS",
          query: parsedQuery,
          filters: effectiveFilters,
          cursor,
          limit: PAGE_SIZE,
        });

        if (response.type === "SEARCH_FILTER_RESULTS") {
          setTweets((prev) => [...prev, ...response.data.items]);
          setCursor(response.data.nextCursor);
          setHasMore(response.data.hasMore);
          await loadFavoriteStates(response.data.items.map((t) => t.id));
        }
      } else {
        const response = await sendMessage({
          type: "BROWSE_TWEETS",
          filters: effectiveFilters,
          cursor,
          limit: PAGE_SIZE,
        });

        if (response.type === "BROWSE_RESULTS") {
          setTweets((prev) => [...prev, ...response.data.items]);
          setCursor(response.data.nextCursor);
          setHasMore(response.data.hasMore);
          await loadFavoriteStates(response.data.items.map((t) => t.id));
        }
      }
    } catch (error) {
      console.error("Failed to load more:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      const { query: parsed, filters: parsedFilters } = parseSearchQuery(query);
      setParsedQuery(parsed);
      setFilters(mergeFilters(filters, parsedFilters));
      loadTweets();
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleFavoriteToggle = async (tweetId: string) => {
    try {
      const response = await sendMessage({ type: "TOGGLE_FAVORITE", tweetId });
      if (response.type === "FAVORITE_TOGGLED") {
        setFavoritedIds((prev) => {
          const newSet = new Set(prev);
          if (response.isFavorited) {
            newSet.add(tweetId);
          } else {
            newSet.delete(tweetId);
          }
          return newSet;
        });

        // Remove from list if in favorites view and unfavorited
        if (viewMode === "favorites" && !response.isFavorited) {
          setTweets((prev) => prev.filter((t) => t.id !== tweetId));
        }
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const handleExpandToggle = (tweetId: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tweetId)) {
        newSet.delete(tweetId);
      } else {
        newSet.add(tweetId);
      }
      return newSet;
    });
  };

  const handleExport = async () => {
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
    }
  };

  const handleClearAll = async () => {
    if (
      !confirm(
        "Are you sure you want to delete all captured tweets? This cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await sendMessage({ type: "CLEAR_ALL" });
      setSettingsOpen(false);
      setTweets([]);
      setFavoritedIds(new Set());
      setCursor(null);
      setHasMore(false);
      loadStats();
    } catch (error) {
      console.error("Clear failed:", error);
    }
  };

  const openFullpage = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("src/fullpage/index.html"),
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (document.activeElement === searchInputRef.current) {
        if (e.key === "Escape") {
          setSearchQuery("");
          setParsedQuery("");
          loadTweets();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          searchInputRef.current?.blur();
          setSelectedIndex(0);
        }
        return;
      }

      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, tweets.length - 1));
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
        case "o":
          if (selectedIndex >= 0 && tweets[selectedIndex]) {
            window.open(tweets[selectedIndex].url, "_blank", "noopener");
          }
          break;
        case "s":
          if (selectedIndex >= 0 && tweets[selectedIndex]) {
            handleFavoriteToggle(tweets[selectedIndex].id);
          }
          break;
        case "Escape":
          setSelectedIndex(-1);
          searchInputRef.current?.focus();
          break;
        case "/":
          e.preventDefault();
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
          break;
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [tweets, selectedIndex]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { rootMargin: "100px" },
    );

    const lastCard = resultsRef.current?.querySelector(
      ".tweet-card:last-child",
    );
    if (lastCard) {
      observer.observe(lastCard);
    }

    return () => observer.disconnect();
  }, [tweets, hasMore, isLoading]);

  const statsText = stats
    ? stats.totalTweets === 0
      ? "No tweets captured yet. Browse Twitter to start!"
      : `${formatNumber(stats.totalTweets)} tweets from ${formatNumber(stats.uniqueAuthors)} authors${stats.oldestTweet ? ` • Since ${formatRelativeTime(stats.oldestTweet)}` : ""}`
    : "Loading...";

  return (
    <div className="flex flex-col h-[600px] w-[400px] bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h1 className="text-base font-bold">Tweet Recall</h1>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={openFullpage}
            title="Open Full View"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Search */}
      <div className="relative px-2.5 py-1.5">
        <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Search your tweet history..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-8 pr-10 h-8 text-sm"
        />
        <kbd className="absolute right-4.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded">
          ⌘K
        </kbd>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setViewMode("recent")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium transition-colors",
            viewMode === "recent"
              ? "bg-secondary text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
          )}
        >
          Recent
        </button>
        <button
          onClick={() => setViewMode("favorites")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium transition-colors",
            viewMode === "favorites"
              ? "bg-secondary text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
          )}
        >
          <Star className="inline-block h-3 w-3 mr-1" />
          Favorites
        </button>
      </div>

      {/* Stats */}
      <div className="px-2.5 py-1 text-[10px] text-muted-foreground border-b border-border">
        {statsText}
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div ref={resultsRef} className="divide-y divide-border">
          {tweets.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-muted-foreground">
              {searchQuery ? (
                <p>No tweets found matching "{searchQuery}"</p>
              ) : viewMode === "favorites" ? (
                <>
                  <Star className="h-8 w-8 mb-2 opacity-50" />
                  <p>No favorited tweets yet</p>
                  <p className="text-xs mt-1">
                    Star tweets to add them to your favorites
                  </p>
                </>
              ) : (
                <>
                  <p>No tweets captured yet</p>
                  <p className="text-xs mt-1">
                    Browse Twitter to start capturing tweets
                  </p>
                </>
              )}
            </div>
          ) : (
            tweets.map((tweet, index) => (
              <TweetCard
                key={tweet.id}
                tweet={tweet}
                isFavorited={favoritedIds.has(tweet.id)}
                isSelected={selectedIndex === index}
                isExpanded={expandedIds.has(tweet.id)}
                onFavoriteClick={() => handleFavoriteToggle(tweet.id)}
                onExpandClick={() => handleExpandToggle(tweet.id)}
                onClick={() => window.open(tweet.url, "_blank", "noopener")}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-4 border-t border-border">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Theme</span>
              <div className="flex border border-border rounded-md overflow-hidden">
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "p-2 transition-colors",
                    theme === "light"
                      ? "bg-secondary text-primary"
                      : "hover:bg-secondary/50",
                  )}
                  title="Light"
                >
                  <Sun className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "p-2 transition-colors",
                    theme === "dark"
                      ? "bg-secondary text-primary"
                      : "hover:bg-secondary/50",
                  )}
                  title="Dark"
                >
                  <Moon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={cn(
                    "p-2 transition-colors",
                    theme === "system"
                      ? "bg-secondary text-primary"
                      : "hover:bg-secondary/50",
                  )}
                  title="System"
                >
                  <Monitor className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="border-t border-border pt-4 flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={handleExport}
                className="justify-start"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data (JSON)
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearAll}
                className="justify-start"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
