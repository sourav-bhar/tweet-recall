import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Search,
  Download,
  Trash2,
  Star,
  Folder,
  ChevronDown,
  List,
  LayoutGrid,
  Loader2,
  Image,
  Plus,
  X,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TweetCard } from "@/components/TweetCard";
import { ImageLightbox } from "@/components/ImageLightbox";
import { sendMessage } from "@/shared/utils/messaging";
import { formatNumber } from "@/shared/utils/formatting";
import { parseSearchQuery, mergeFilters } from "@/shared/utils/searchOperators";
import type {
  CapturedTweet,
  SearchResult,
  TweetStats,
  TweetFilters,
  PaginationCursor,
  Collection,
} from "@/types";

const PAGE_SIZE = 30;
const SEARCH_DEBOUNCE_MS = 200;

type SortOrder = "newest" | "oldest" | "author";
type ViewMode = "list" | "grid";
type TimeFilter = "all" | "today" | "week" | "month";

const COLORS = [
  "#f4212e",
  "#ff7a00",
  "#ffd700",
  "#00ba7c",
  "#1d9bf0",
  "#7856ff",
  "#f91880",
  "#71767b",
];

export function App() {
  // Theme
  const { theme, setTheme } = useTheme();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [parsedQuery, setParsedQuery] = useState("");
  const [filters, setFilters] = useState<TweetFilters>({});
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showMedia, setShowMedia] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<PaginationCursor | null>(null);
  const [tweets, setTweets] = useState<(CapturedTweet | SearchResult)[]>([]);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [collections, setCollections] = useState<Collection[]>([]);
  const [stats, setStats] = useState<TweetStats | null>(null);

  // Modal state
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [addToCollectionOpen, setAddToCollectionOpen] = useState(false);
  const [pendingTweetId, setPendingTweetId] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [newCollectionColor, setNewCollectionColor] = useState("#1d9bf0");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sort tweets based on sortOrder
  const sortedTweets = useMemo(() => {
    const tweetsToSort = [...tweets];
    switch (sortOrder) {
      case "newest":
        return tweetsToSort.sort((a, b) => b.seenAt - a.seenAt);
      case "oldest":
        return tweetsToSort.sort((a, b) => a.seenAt - b.seenAt);
      case "author":
        return tweetsToSort.sort((a, b) =>
          a.author.toLowerCase().localeCompare(b.author.toLowerCase()),
        );
      default:
        return tweetsToSort;
    }
  }, [tweets, sortOrder]);

  // Load initial data
  useEffect(() => {
    loadStats();
    loadCollections();
    loadTweets();
  }, []);

  // Reload tweets when filters change
  useEffect(() => {
    loadTweets();
  }, [timeFilter, selectedCollection]);

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

  const loadCollections = async () => {
    try {
      const response = await sendMessage({ type: "GET_COLLECTIONS" });
      if (response.type === "COLLECTIONS") {
        setCollections(response.collections);
      }
    } catch (error) {
      console.error("Failed to load collections:", error);
    }
  };

  const getEffectiveFilters = useCallback(
    (overrideFilters?: TweetFilters): TweetFilters => {
      const baseFilters: TweetFilters = { ...(overrideFilters ?? filters) };

      // Time filter
      const now = Date.now();
      switch (timeFilter) {
        case "today":
          baseFilters.seenAfter = now - 24 * 60 * 60 * 1000;
          break;
        case "week":
          baseFilters.seenAfter = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case "month":
          baseFilters.seenAfter = now - 30 * 24 * 60 * 60 * 1000;
          break;
      }

      // Collection filter
      if (selectedCollection !== "all") {
        baseFilters.collectionId = selectedCollection;
      }

      return baseFilters;
    },
    [filters, timeFilter, selectedCollection],
  );

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
        // Ignore
      }
    }
    setFavoritedIds(newFavorited);
  };

  const loadTweets = async (
    overrideQuery?: string,
    overrideFilters?: TweetFilters,
  ) => {
    setIsLoading(true);
    setCursor(null);
    setHasMore(true);
    setTweets([]);
    setSelectedIndex(-1);

    const queryToUse = overrideQuery ?? parsedQuery;
    const filtersToUse = overrideFilters ?? filters;
    const effectiveFilters = getEffectiveFilters(filtersToUse);
    const hasTextQuery = queryToUse.trim().length > 0;
    const hasFilters = Object.keys(filtersToUse).length > 0;

    try {
      if (hasTextQuery || hasFilters) {
        const response = await sendMessage({
          type: "SEARCH_WITH_FILTERS",
          query: queryToUse,
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
      const newFilters = mergeFilters({}, parsedFilters);
      setParsedQuery(parsed);
      setFilters(newFilters);
      // Pass values directly to avoid stale closure
      loadTweets(parsed, newFilters);
    }, SEARCH_DEBOUNCE_MS);
  };

  const clearSearch = () => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    setSearchQuery("");
    setParsedQuery("");
    setFilters({});
    loadTweets("", {});
    searchInputRef.current?.focus();
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

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

        if (selectedCollection === "__favorites__" && !response.isFavorited) {
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

  const handleImageClick = (imageUrl: string, allImages: string[]) => {
    const index = allImages.indexOf(imageUrl);
    setLightboxImages(allImages);
    setLightboxIndex(index >= 0 ? index : 0);
    setLightboxOpen(true);
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    try {
      const response = await sendMessage({
        type: "CREATE_COLLECTION",
        name: newCollectionName.trim(),
        description: newCollectionDesc.trim() || undefined,
        color: newCollectionColor,
      });

      if (response.type === "COLLECTION_CREATED") {
        setCollections((prev) => [...prev, response.collection]);
        setCreateCollectionOpen(false);
        setNewCollectionName("");
        setNewCollectionDesc("");
        setNewCollectionColor("#1d9bf0");
      }
    } catch (error) {
      console.error("Failed to create collection:", error);
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    const collection = collections.find((c) => c.id === collectionId);
    if (
      !collection ||
      !confirm(`Delete "${collection.name}"? Tweets won't be deleted.`)
    ) {
      return;
    }

    try {
      const response = await sendMessage({
        type: "DELETE_COLLECTION",
        id: collectionId,
      });
      if (response.type === "COLLECTION_DELETED") {
        setCollections((prev) => prev.filter((c) => c.id !== collectionId));
        if (selectedCollection === collectionId) {
          setSelectedCollection("all");
        }
      }
    } catch (error) {
      console.error("Failed to delete collection:", error);
    }
  };

  const handleAddToCollection = async (collectionId: string) => {
    if (!pendingTweetId) return;

    try {
      const response = await sendMessage({
        type: "ADD_TO_COLLECTION",
        collectionId,
        tweetId: pendingTweetId,
      });

      if (response.type === "ADDED_TO_COLLECTION") {
        setAddToCollectionOpen(false);
        setPendingTweetId(null);
      }
    } catch (error) {
      console.error("Failed to add to collection:", error);
    }
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
    if (!confirm("Delete all captured tweets? This cannot be undone.")) return;

    try {
      await sendMessage({ type: "CLEAR_ALL" });
      setTweets([]);
      setFavoritedIds(new Set());
      setCursor(null);
      setHasMore(false);
      loadStats();
    } catch (error) {
      console.error("Clear failed:", error);
    }
  };

  const sortLabels: Record<SortOrder, string> = {
    newest: "Newest First",
    oldest: "Oldest First",
    author: "By Author",
  };

  const customCollections = collections.filter((c) => !c.isBuiltIn);

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <img src="/icons/icon.svg" alt="Tweet Recall" className="h-6 w-6" />
            <h1 className="text-xl font-bold">Tweet Recall</h1>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {/* Time Filter */}
          <section className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">
              Time Filter
            </h2>
            <div className="flex flex-col gap-1">
              {(["all", "today", "week", "month"] as TimeFilter[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeFilter(t)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md text-left transition-colors",
                    timeFilter === t
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary",
                  )}
                >
                  {t === "all"
                    ? "All Time"
                    : t === "today"
                      ? "Today"
                      : t === "week"
                        ? "Last 7 Days"
                        : "Last 30 Days"}
                </button>
              ))}
            </div>
          </section>

          {/* Collections */}
          <section className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Collections
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setCreateCollectionOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setSelectedCollection("all")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-left transition-colors",
                  selectedCollection === "all"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary",
                )}
              >
                <Folder className="h-4 w-4" />
                All Tweets
              </button>
              <button
                onClick={() => setSelectedCollection("__favorites__")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-left transition-colors",
                  selectedCollection === "__favorites__"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary",
                )}
              >
                <Star className="h-4 w-4" />
                Favorites
              </button>
              {customCollections.map((collection) => (
                <div
                  key={collection.id}
                  className={cn(
                    "group flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-left transition-colors cursor-pointer",
                    selectedCollection === collection.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary",
                  )}
                  onClick={() => setSelectedCollection(collection.id)}
                >
                  <Folder
                    className="h-4 w-4"
                    style={{ color: collection.color }}
                  />
                  <span className="flex-1 truncate">{collection.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCollection(collection.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Stats */}
          <section className="p-4 border-b border-border">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {stats ? formatNumber(stats.totalTweets) : "0"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Tweets
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {stats ? formatNumber(stats.uniqueAuthors) : "0"}
                </div>
                <div className="text-xs text-muted-foreground">Authors</div>
              </div>
            </div>
          </section>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-sm text-muted-foreground">Theme</span>
            <div className="flex border border-border rounded-md overflow-hidden">
              <button
                onClick={() => setTheme("light")}
                className={cn(
                  "p-1.5 transition-colors",
                  theme === "light"
                    ? "bg-secondary text-primary"
                    : "hover:bg-secondary/50",
                )}
                title="Light"
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={cn(
                  "p-1.5 transition-colors",
                  theme === "dark"
                    ? "bg-secondary text-primary"
                    : "hover:bg-secondary/50",
                )}
                title="Dark"
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setTheme("system")}
                className={cn(
                  "p-1.5 transition-colors",
                  theme === "system"
                    ? "bg-secondary text-primary"
                    : "hover:bg-secondary/50",
                )}
                title="System"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleClearAll}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Data
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-4 p-4 border-b border-border">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search tweets... (try from:username, has:media)"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortMenuOpen(!sortMenuOpen)}
              className="gap-1"
            >
              {sortLabels[sortOrder]}
              <ChevronDown className="h-4 w-4" />
            </Button>
            {sortMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1 border rounded-md shadow-lg z-50 overflow-hidden min-w-[140px]"
                style={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                }}
              >
                {(["newest", "oldest", "author"] as SortOrder[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSortOrder(s);
                      setSortMenuOpen(false);
                    }}
                    className={cn(
                      "block w-full px-4 py-2 text-sm text-left transition-colors",
                      sortOrder === s ? "bg-secondary" : "hover:bg-secondary",
                    )}
                    style={
                      sortOrder === s
                        ? { backgroundColor: "hsl(var(--secondary))" }
                        : undefined
                    }
                  >
                    {sortLabels[s]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "list"
                  ? "bg-secondary text-primary"
                  : "hover:bg-secondary/50",
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "grid"
                  ? "bg-secondary text-primary"
                  : "hover:bg-secondary/50",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          {/* Media Toggle with shadcn Switch */}
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 text-muted-foreground" />
            <Switch
              checked={showMedia}
              onCheckedChange={setShowMedia}
              aria-label="Show images"
            />
            <span className="text-sm text-muted-foreground">Images</span>
          </div>
        </header>

        {/* Results Count */}
        <div className="px-4 py-2 text-sm text-muted-foreground border-b border-border">
          {isLoading ? "Loading..." : `${sortedTweets.length} tweets`}
        </div>

        {/* Results */}
        <ScrollArea className="flex-1">
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-2 lg:grid-cols-3 gap-4 p-4"
                : "divide-y divide-border",
            )}
          >
            {sortedTweets.length === 0 && !isLoading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p>
                  {searchQuery
                    ? `No tweets found matching "${searchQuery}"`
                    : "No tweets to display"}
                </p>
              </div>
            ) : (
              sortedTweets.map((tweet, index) => (
                <TweetCard
                  key={tweet.id}
                  tweet={tweet}
                  variant={viewMode === "grid" ? "compact" : "expanded"}
                  isFavorited={favoritedIds.has(tweet.id)}
                  isSelected={selectedIndex === index}
                  isExpanded={expandedIds.has(tweet.id)}
                  showMedia={showMedia}
                  onFavoriteClick={() => handleFavoriteToggle(tweet.id)}
                  onExpandClick={() => handleExpandToggle(tweet.id)}
                  onAddToCollection={() => {
                    setPendingTweetId(tweet.id);
                    setAddToCollectionOpen(true);
                  }}
                  onImageClick={handleImageClick}
                  onClick={() => window.open(tweet.url, "_blank", "noopener")}
                />
              ))
            )}
          </div>

          {/* Load More */}
          {hasMore && sortedTweets.length > 0 && (
            <div className="p-4 text-center">
              <Button variant="outline" onClick={loadMore} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Load More
              </Button>
            </div>
          )}
        </ScrollArea>
      </main>

      {/* Create Collection Dialog */}
      <Dialog
        open={createCollectionOpen}
        onOpenChange={setCreateCollectionOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="My Collection"
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Description (optional)
              </label>
              <Input
                value={newCollectionDesc}
                onChange={(e) => setNewCollectionDesc(e.target.value)}
                placeholder="A brief description..."
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Color</label>
              <div className="flex gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewCollectionColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-transform",
                      newCollectionColor === color &&
                        "ring-2 ring-offset-2 ring-offset-background ring-white scale-110",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateCollectionOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Collection Dialog */}
      <Dialog open={addToCollectionOpen} onOpenChange={setAddToCollectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Collection</DialogTitle>
          </DialogHeader>
          {customCollections.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No collections yet. Create one first!
            </p>
          ) : (
            <div className="space-y-2">
              {customCollections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => handleAddToCollection(collection.id)}
                  className="flex items-center gap-2 w-full p-3 rounded-md border border-border hover:bg-secondary transition-colors"
                >
                  <Folder
                    className="h-4 w-4"
                    style={{ color: collection.color }}
                  />
                  <span>{collection.name}</span>
                </button>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddToCollectionOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
}
