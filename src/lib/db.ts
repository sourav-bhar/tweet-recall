import { openDB, type IDBPDatabase } from "idb";
import type { CapturedTweet, TweetStats } from "../types";

const DB_NAME = "tweet-recall";
const DB_VERSION = 1;
const STORE_NAME = "tweets";

type TweetDB = IDBPDatabase<{
  tweets: {
    key: string;
    value: CapturedTweet;
    indexes: {
      "by-seen-at": number;
      "by-author": string;
    };
  };
}>;

let dbInstance: TweetDB | null = null;

/**
 * Get or create the IndexedDB connection
 */
async function getDB(): Promise<TweetDB> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<{
    tweets: {
      key: string;
      value: CapturedTweet;
      indexes: {
        "by-seen-at": number;
        "by-author": string;
      };
    };
  }>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
      store.createIndex("by-seen-at", "seenAt");
      store.createIndex("by-author", "author");
    },
  });

  return dbInstance;
}

/**
 * Store multiple tweets (with deduplication)
 */
export async function storeTweets(tweets: CapturedTweet[]): Promise<number> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  let newCount = 0;
  for (const tweet of tweets) {
    const existing = await store.get(tweet.id);
    if (!existing) {
      await store.put(tweet);
      newCount++;
    }
  }

  await tx.done;
  return newCount;
}

/**
 * Get all tweets (for search indexing)
 */
export async function getAllTweets(): Promise<CapturedTweet[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

/**
 * Get tweets by IDs (for search results)
 */
export async function getTweetsByIds(ids: string[]): Promise<CapturedTweet[]> {
  const db = await getDB();
  const tweets: CapturedTweet[] = [];

  for (const id of ids) {
    const tweet = await db.get(STORE_NAME, id);
    if (tweet) tweets.push(tweet);
  }

  return tweets;
}

/**
 * Get tweet statistics
 */
export async function getStats(): Promise<TweetStats> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const index = store.index("by-seen-at");

  const allTweets = await store.getAll();
  const totalTweets = allTweets.length;

  if (totalTweets === 0) {
    return {
      totalTweets: 0,
      oldestTweet: null,
      newestTweet: null,
      uniqueAuthors: 0,
    };
  }

  // Get oldest and newest by seenAt
  const oldestCursor = await index.openCursor();
  const newestCursor = await index.openCursor(null, "prev");

  const uniqueAuthors = new Set(allTweets.map((t) => t.author)).size;

  return {
    totalTweets,
    oldestTweet: oldestCursor?.value.seenAt ?? null,
    newestTweet: newestCursor?.value.seenAt ?? null,
    uniqueAuthors,
  };
}

/**
 * Clear all stored tweets
 */
export async function clearAll(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

/**
 * Get total count of stored tweets
 */
export async function getTweetCount(): Promise<number> {
  const db = await getDB();
  return db.count(STORE_NAME);
}
