import MiniSearch from "minisearch";
import type { CapturedTweet, SearchResult } from "../types";

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
