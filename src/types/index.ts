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
 * Messages between content script and background worker
 */
export type ExtensionMessage =
  | { type: "TWEETS_CAPTURED"; tweets: CapturedTweet[] }
  | { type: "SEARCH_TWEETS"; query: string }
  | { type: "GET_STATS" }
  | { type: "CLEAR_ALL" }
  | { type: "EXPORT_DATA" };

export type ExtensionResponse =
  | { type: "SEARCH_RESULTS"; results: SearchResult[]; totalStored: number }
  | { type: "STATS"; stats: TweetStats }
  | { type: "CLEARED" }
  | { type: "EXPORTED"; data: CapturedTweet[] }
  | { type: "ERROR"; message: string };
