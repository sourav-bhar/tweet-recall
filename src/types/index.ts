/**
 * Represents a tweet captured from the user's browsing
 */
export interface CapturedTweet {
  /** Twitter's unique tweet ID */
  id: string;
  /** Full tweet text content */
  text: string;
  /** Author's @handle (without @) */
  author: string;
  /** Author's display name */
  authorName: string;
  /** When the tweet was posted (Unix timestamp) */
  postedAt: number;
  /** When the user saw this tweet (Unix timestamp) */
  seenAt: number;
  /** Direct URL to the tweet */
  url: string;
  /** Whether the tweet contains media (images/video) */
  hasMedia: boolean;
  /** Whether this is a retweet */
  isRetweet: boolean;
  /** Whether this is part of a thread */
  isThread: boolean;
  /** Quoted tweet text if this is a quote tweet */
  quotedText?: string;
  /** Quoted tweet author if this is a quote tweet */
  quotedAuthor?: string;
}

/**
 * Search result with relevance score
 */
export interface SearchResult extends CapturedTweet {
  /** MiniSearch relevance score */
  score: number;
  /** Matched terms for highlighting */
  match: Record<string, string[]>;
}

/**
 * Statistics about stored tweets
 */
export interface TweetStats {
  totalTweets: number;
  oldestTweet: number | null;
  newestTweet: number | null;
  uniqueAuthors: number;
}

/**
 * User-created collection of tweets
 */
export interface Collection {
  /** Unique collection ID */
  id: string;
  /** User-defined name */
  name: string;
  /** Optional description */
  description?: string;
  /** When collection was created (Unix timestamp) */
  createdAt: number;
  /** When collection was last updated (Unix timestamp) */
  updatedAt: number;
  /** Optional accent color */
  color?: string;
  /** Optional icon (emoji or icon name) */
  icon?: string;
  /** Whether this is a built-in collection (e.g., Favorites) */
  isBuiltIn?: boolean;
}

/**
 * Association between a tweet and a collection
 */
export interface CollectionTweet {
  /** Compound key: `${collectionId}-${tweetId}` */
  id: string;
  /** Reference to collection */
  collectionId: string;
  /** Reference to tweet */
  tweetId: string;
  /** When the tweet was added to collection (Unix timestamp) */
  addedAt: number;
  /** Optional user note for this tweet in this collection */
  note?: string;
}

/**
 * Filters for querying tweets
 */
export interface TweetFilters {
  /** Filter tweets seen after this timestamp */
  seenAfter?: number;
  /** Filter tweets seen before this timestamp */
  seenBefore?: number;
  /** Filter tweets posted after this timestamp */
  postedAfter?: number;
  /** Filter tweets posted before this timestamp */
  postedBefore?: number;
  /** Filter by author handle */
  author?: string;
  /** Filter tweets with/without media */
  hasMedia?: boolean;
  /** Filter retweets */
  isRetweet?: boolean;
  /** Filter thread tweets */
  isThread?: boolean;
  /** Filter quote tweets (has quotedText) */
  isQuoteTweet?: boolean;
  /** Filter by collection ID */
  collectionId?: string;
  /** Text search query */
  searchQuery?: string;
}

/**
 * Cursor for paginated results
 */
export interface PaginationCursor {
  /** Last item's seenAt timestamp */
  seenAt: number;
  /** Last item's ID (tie-breaker) */
  id: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResult<T> {
  /** Result items */
  items: T[];
  /** Cursor for next page, null if no more pages */
  nextCursor: PaginationCursor | null;
  /** Whether more results exist */
  hasMore: boolean;
  /** Approximate total count (optional) */
  totalEstimate?: number;
}

/**
 * Author info with tweet count
 */
export interface AuthorInfo {
  /** Author handle */
  handle: string;
  /** Author display name */
  name: string;
  /** Number of tweets from this author */
  count: number;
}

/**
 * Messages between content script/popup and background worker
 */
export type ExtensionMessage =
  // Existing messages
  | { type: "TWEETS_CAPTURED"; tweets: CapturedTweet[] }
  | { type: "SEARCH_TWEETS"; query: string }
  | { type: "GET_STATS" }
  | { type: "CLEAR_ALL" }
  | { type: "EXPORT_DATA" }
  // Browse and filter messages
  | { type: "BROWSE_TWEETS"; filters: TweetFilters; cursor?: PaginationCursor; limit?: number }
  | { type: "SEARCH_WITH_FILTERS"; query: string; filters: TweetFilters; cursor?: PaginationCursor; limit?: number }
  | { type: "GET_AUTHORS" }
  // Collection management messages
  | { type: "GET_COLLECTIONS" }
  | { type: "CREATE_COLLECTION"; name: string; description?: string; color?: string; icon?: string }
  | { type: "UPDATE_COLLECTION"; id: string; updates: Partial<Pick<Collection, "name" | "description" | "color" | "icon">> }
  | { type: "DELETE_COLLECTION"; id: string }
  // Tweet-collection operations
  | { type: "ADD_TO_COLLECTION"; collectionId: string; tweetId: string; note?: string }
  | { type: "REMOVE_FROM_COLLECTION"; collectionId: string; tweetId: string }
  | { type: "GET_TWEET_COLLECTIONS"; tweetId: string }
  // Favorites operations
  | { type: "TOGGLE_FAVORITE"; tweetId: string }
  | { type: "IS_FAVORITED"; tweetId: string };

export type ExtensionResponse =
  // Existing responses
  | { type: "SEARCH_RESULTS"; results: SearchResult[]; totalStored: number }
  | { type: "STATS"; stats: TweetStats }
  | { type: "CLEARED" }
  | { type: "EXPORTED"; data: CapturedTweet[] }
  | { type: "ERROR"; message: string }
  // Browse and filter responses
  | { type: "BROWSE_RESULTS"; data: PaginatedResult<CapturedTweet> }
  | { type: "SEARCH_FILTER_RESULTS"; data: PaginatedResult<SearchResult> }
  | { type: "AUTHORS"; authors: AuthorInfo[] }
  // Collection responses
  | { type: "COLLECTIONS"; collections: Collection[] }
  | { type: "COLLECTION_CREATED"; collection: Collection }
  | { type: "COLLECTION_UPDATED"; collection: Collection }
  | { type: "COLLECTION_DELETED" }
  | { type: "ADDED_TO_COLLECTION"; association: CollectionTweet }
  | { type: "REMOVED_FROM_COLLECTION" }
  | { type: "TWEET_COLLECTIONS"; collections: Collection[] }
  // Favorites responses
  | { type: "FAVORITE_TOGGLED"; isFavorited: boolean }
  | { type: "IS_FAVORITED_RESULT"; isFavorited: boolean };
