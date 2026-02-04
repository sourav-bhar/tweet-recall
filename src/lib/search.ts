import MiniSearch from "minisearch";
import type {
  CapturedTweet,
  SearchResult,
  TweetFilters,
  PaginationCursor,
  PaginatedResult,
} from "../types";
import { queryTweets, getCollectionsForTweet } from "./db";

// MiniSearch instance - will be rebuilt when needed
let searchIndex: MiniSearch<CapturedTweet> | null = null;
let indexedIds = new Set<string>();

/**
 * Create a fresh search index
 */
function createIndex(): MiniSearch<CapturedTweet> {
  return new MiniSearch<CapturedTweet>({
    fields: ["text", "author", "authorName", "quotedText", "quotedAuthor"],
    storeFields: [
      "id",
      "text",
      "author",
      "authorName",
      "postedAt",
      "seenAt",
      "url",
      "hasMedia",
      "isRetweet",
      "isThread",
      "quotedText",
      "quotedAuthor",
    ],
    searchOptions: {
      boost: { text: 2, authorName: 1.5, author: 1.5 },
      fuzzy: 0.2,
      prefix: true,
    },
  });
}

/**
 * Initialize or rebuild the search index with all tweets
 */
export function initializeIndex(tweets: CapturedTweet[]): void {
  searchIndex = createIndex();
  indexedIds = new Set();

  for (const tweet of tweets) {
    searchIndex.add(tweet);
    indexedIds.add(tweet.id);
  }

  console.log(
    `[Tweet Recall] Search index initialized with ${tweets.length} tweets`,
  );
}

/**
 * Add new tweets to the existing index (incremental)
 */
export function addToIndex(tweets: CapturedTweet[]): number {
  if (!searchIndex) {
    initializeIndex(tweets);
    return tweets.length;
  }

  let added = 0;
  for (const tweet of tweets) {
    if (!indexedIds.has(tweet.id)) {
      searchIndex.add(tweet);
      indexedIds.add(tweet.id);
      added++;
    }
  }

  return added;
}

/**
 * Search tweets by query
 */
export function searchTweets(query: string, limit = 50): SearchResult[] {
  if (!searchIndex || !query.trim()) {
    return [];
  }

  const results = searchIndex.search(query);

  return results.slice(0, limit).map((result) => ({
    ...(result as unknown as CapturedTweet),
    score: result.score,
    match: result.match,
  }));
}

/**
 * Get index status
 */
export function getIndexStatus(): { indexed: number; ready: boolean } {
  return {
    indexed: indexedIds.size,
    ready: searchIndex !== null,
  };
}

/**
 * Clear the search index
 */
export function clearIndex(): void {
  searchIndex = null;
  indexedIds = new Set();
}

/**
 * Check if a tweet matches all filter criteria
 */
function matchesFilters(tweet: CapturedTweet, filters: TweetFilters): boolean {
  if (filters.seenAfter && tweet.seenAt < filters.seenAfter) return false;
  if (filters.seenBefore && tweet.seenAt > filters.seenBefore) return false;
  if (filters.postedAfter && tweet.postedAt < filters.postedAfter) return false;
  if (filters.postedBefore && tweet.postedAt > filters.postedBefore) return false;
  if (filters.author && tweet.author !== filters.author) return false;
  if (filters.hasMedia !== undefined && tweet.hasMedia !== filters.hasMedia) return false;
  if (filters.isRetweet !== undefined && tweet.isRetweet !== filters.isRetweet) return false;
  if (filters.isThread !== undefined && tweet.isThread !== filters.isThread) return false;
  if (filters.isQuoteTweet !== undefined && !!tweet.quotedText !== filters.isQuoteTweet) return false;

  return true;
}

/**
 * Search with filters - combines MiniSearch text search with filters
 */
export async function searchWithFilters(
  query: string,
  filters: TweetFilters,
  cursor?: PaginationCursor,
  limit: number = 50
): Promise<PaginatedResult<SearchResult>> {
  // If no text query, use pure IndexedDB browsing
  if (!query.trim()) {
    const browseResult = await queryTweets(filters, cursor, limit);
    return {
      ...browseResult,
      items: browseResult.items.map((tweet) => ({
        ...tweet,
        score: 0,
        match: {},
      })),
    };
  }

  // Get MiniSearch results (larger limit to account for filtering)
  const searchLimit = limit * 5; // Over-fetch to account for filter loss
  const searchResults = searchTweets(query, searchLimit);

  // Apply filters to search results
  const filteredResults: SearchResult[] = [];

  for (const result of searchResults) {
    const tweet = result as CapturedTweet;

    if (!matchesFilters(tweet, filters)) continue;

    // For collection filter, need async check
    if (filters.collectionId) {
      const collections = await getCollectionsForTweet(tweet.id);
      if (!collections.some((c) => c.id === filters.collectionId)) continue;
    }

    filteredResults.push(result);

    if (filteredResults.length >= limit + 1) break;
  }

  // Handle pagination for search results
  let startIndex = 0;
  if (cursor) {
    startIndex = filteredResults.findIndex(
      (r) => r.seenAt === cursor.seenAt && r.id === cursor.id
    );
    if (startIndex === -1) startIndex = 0;
    else startIndex += 1; // Start after cursor
  }

  const paginatedResults = filteredResults.slice(startIndex, startIndex + limit);
  const lastItem = paginatedResults[paginatedResults.length - 1];
  const hasMore = filteredResults.length > startIndex + limit;

  return {
    items: paginatedResults,
    nextCursor:
      hasMore && lastItem
        ? { seenAt: lastItem.seenAt, id: lastItem.id }
        : null,
    hasMore,
  };
}
