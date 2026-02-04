import { openDB, type IDBPDatabase } from "idb";
import type {
  CapturedTweet,
  TweetStats,
  Collection,
  CollectionTweet,
  TweetFilters,
  PaginationCursor,
  PaginatedResult,
  AuthorInfo,
} from "../types";

const DB_NAME = "tweet-recall";
const DB_VERSION = 2;
const TWEETS_STORE = "tweets";
const COLLECTIONS_STORE = "collections";
const COLLECTION_TWEETS_STORE = "collection-tweets";

// Built-in collection IDs
export const FAVORITES_COLLECTION_ID = "__favorites__";

/**
 * Database schema type definition
 */
type TweetDB = IDBPDatabase<{
  tweets: {
    key: string;
    value: CapturedTweet;
    indexes: {
      "by-seen-at": number;
      "by-author": string;
      "by-posted-at": number;
      "by-has-media": number;
      "by-is-retweet": number;
      "by-is-thread": number;
      "by-author-seen-at": [string, number];
      "by-seen-at-id": [number, string];
    };
  };
  collections: {
    key: string;
    value: Collection;
    indexes: {
      "by-name": string;
      "by-created-at": number;
    };
  };
  "collection-tweets": {
    key: string;
    value: CollectionTweet;
    indexes: {
      "by-collection-id": string;
      "by-tweet-id": string;
      "by-collection-added-at": [string, number];
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
        "by-posted-at": number;
        "by-has-media": number;
        "by-is-retweet": number;
        "by-is-thread": number;
        "by-author-seen-at": [string, number];
        "by-seen-at-id": [number, string];
      };
    };
    collections: {
      key: string;
      value: Collection;
      indexes: {
        "by-name": string;
        "by-created-at": number;
      };
    };
    "collection-tweets": {
      key: string;
      value: CollectionTweet;
      indexes: {
        "by-collection-id": string;
        "by-tweet-id": string;
        "by-collection-added-at": [string, number];
      };
    };
  }>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      // Version 1: Initial schema
      if (oldVersion < 1) {
        const tweetsStore = db.createObjectStore(TWEETS_STORE, { keyPath: "id" });
        tweetsStore.createIndex("by-seen-at", "seenAt");
        tweetsStore.createIndex("by-author", "author");
      }

      // Version 2: Add new indexes and collection stores
      if (oldVersion < 2) {
        const tweetsStore = transaction.objectStore(TWEETS_STORE);

        if (!tweetsStore.indexNames.contains("by-posted-at")) {
          tweetsStore.createIndex("by-posted-at", "postedAt");
        }
        if (!tweetsStore.indexNames.contains("by-has-media")) {
          tweetsStore.createIndex("by-has-media", "hasMedia");
        }
        if (!tweetsStore.indexNames.contains("by-is-retweet")) {
          tweetsStore.createIndex("by-is-retweet", "isRetweet");
        }
        if (!tweetsStore.indexNames.contains("by-is-thread")) {
          tweetsStore.createIndex("by-is-thread", "isThread");
        }
        if (!tweetsStore.indexNames.contains("by-author-seen-at")) {
          tweetsStore.createIndex("by-author-seen-at", ["author", "seenAt"]);
        }
        if (!tweetsStore.indexNames.contains("by-seen-at-id")) {
          tweetsStore.createIndex("by-seen-at-id", ["seenAt", "id"]);
        }

        const collectionsStore = db.createObjectStore(COLLECTIONS_STORE, { keyPath: "id" });
        collectionsStore.createIndex("by-name", "name");
        collectionsStore.createIndex("by-created-at", "createdAt");

        const collectionTweetsStore = db.createObjectStore(COLLECTION_TWEETS_STORE, { keyPath: "id" });
        collectionTweetsStore.createIndex("by-collection-id", "collectionId");
        collectionTweetsStore.createIndex("by-tweet-id", "tweetId");
        collectionTweetsStore.createIndex("by-collection-added-at", ["collectionId", "addedAt"]);

        const favoritesCollection: Collection = {
          id: FAVORITES_COLLECTION_ID,
          name: "Favorites",
          description: "Your favorited tweets",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          icon: "star",
          isBuiltIn: true,
        };
        collectionsStore.add(favoritesCollection);
      }
    },
  });

  return dbInstance;
}

// =============================================================================
// Tweet Operations
// =============================================================================

export async function storeTweets(tweets: CapturedTweet[]): Promise<number> {
  const db = await getDB();
  const tx = db.transaction(TWEETS_STORE, "readwrite");
  const store = tx.objectStore(TWEETS_STORE);

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

export async function getAllTweets(): Promise<CapturedTweet[]> {
  const db = await getDB();
  return db.getAll(TWEETS_STORE);
}

export async function getTweetsByIds(ids: string[]): Promise<CapturedTweet[]> {
  const db = await getDB();
  const tweets: CapturedTweet[] = [];

  for (const id of ids) {
    const tweet = await db.get(TWEETS_STORE, id);
    if (tweet) tweets.push(tweet);
  }

  return tweets;
}

export async function getStats(): Promise<TweetStats> {
  const db = await getDB();
  const tx = db.transaction(TWEETS_STORE, "readonly");
  const store = tx.objectStore(TWEETS_STORE);
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

export async function clearAll(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([TWEETS_STORE, COLLECTIONS_STORE, COLLECTION_TWEETS_STORE], "readwrite");

  await tx.objectStore(TWEETS_STORE).clear();
  await tx.objectStore(COLLECTION_TWEETS_STORE).clear();

  const collectionsStore = tx.objectStore(COLLECTIONS_STORE);
  const collections = await collectionsStore.getAll();
  for (const collection of collections) {
    if (!collection.isBuiltIn) {
      await collectionsStore.delete(collection.id);
    }
  }

  await tx.done;
}

export async function getTweetCount(): Promise<number> {
  const db = await getDB();
  return db.count(TWEETS_STORE);
}

export async function getAuthors(): Promise<AuthorInfo[]> {
  const db = await getDB();
  const allTweets = await db.getAll(TWEETS_STORE);

  const authorMap = new Map<string, { name: string; count: number }>();

  for (const tweet of allTweets) {
    const existing = authorMap.get(tweet.author);
    if (existing) {
      existing.count++;
    } else {
      authorMap.set(tweet.author, { name: tweet.authorName, count: 1 });
    }
  }

  const authors: AuthorInfo[] = [];
  for (const [handle, { name, count }] of authorMap) {
    authors.push({ handle, name, count });
  }

  authors.sort((a, b) => b.count - a.count);

  return authors;
}

// =============================================================================
// Query Operations
// =============================================================================

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

export async function queryTweets(
  filters: TweetFilters,
  cursor?: PaginationCursor,
  limit: number = 50
): Promise<PaginatedResult<CapturedTweet>> {
  const db = await getDB();

  if (filters.collectionId) {
    return queryByCollection(db, filters, cursor, limit);
  }

  return queryBySeenAt(db, filters, cursor, limit);
}

async function queryBySeenAt(
  db: TweetDB,
  filters: TweetFilters,
  cursor: PaginationCursor | undefined,
  limit: number
): Promise<PaginatedResult<CapturedTweet>> {
  const tx = db.transaction(TWEETS_STORE, "readonly");
  const store = tx.objectStore(TWEETS_STORE);
  const index = store.index("by-seen-at-id");

  let keyRange: IDBKeyRange | undefined;

  if (cursor) {
    keyRange = IDBKeyRange.upperBound([cursor.seenAt, cursor.id], true);
  } else if (filters.seenBefore) {
    keyRange = IDBKeyRange.upperBound([filters.seenBefore, "\uffff"], false);
  }

  const items: CapturedTweet[] = [];
  let cursorPosition = await index.openCursor(keyRange, "prev");

  while (cursorPosition && items.length < limit + 1) {
    const tweet = cursorPosition.value;

    if (matchesFilters(tweet, filters)) {
      items.push(tweet);
    }

    cursorPosition = await cursorPosition.continue();
  }

  const hasMore = items.length > limit;
  const resultItems = items.slice(0, limit);
  const lastItem = resultItems[resultItems.length - 1];

  return {
    items: resultItems,
    nextCursor: hasMore && lastItem ? { seenAt: lastItem.seenAt, id: lastItem.id } : null,
    hasMore,
  };
}

async function queryByCollection(
  db: TweetDB,
  filters: TweetFilters,
  cursor: PaginationCursor | undefined,
  limit: number
): Promise<PaginatedResult<CapturedTweet>> {
  const collectionId = filters.collectionId!;
  const tx = db.transaction([COLLECTION_TWEETS_STORE, TWEETS_STORE], "readonly");
  const collectionTweetsStore = tx.objectStore(COLLECTION_TWEETS_STORE);
  const tweetsStore = tx.objectStore(TWEETS_STORE);
  const index = collectionTweetsStore.index("by-collection-added-at");

  let keyRange: IDBKeyRange;
  if (cursor) {
    keyRange = IDBKeyRange.bound([collectionId, 0], [collectionId, cursor.seenAt], false, true);
  } else {
    keyRange = IDBKeyRange.bound([collectionId, 0], [collectionId, Infinity]);
  }

  const items: CapturedTweet[] = [];
  let cursorPosition = await index.openCursor(keyRange, "prev");

  while (cursorPosition && items.length < limit + 1) {
    const association = cursorPosition.value;
    const tweet = await tweetsStore.get(association.tweetId);

    if (tweet && matchesFilters(tweet, filters)) {
      items.push(tweet);
    }

    cursorPosition = await cursorPosition.continue();
  }

  const hasMore = items.length > limit;
  const resultItems = items.slice(0, limit);
  const lastItem = resultItems[resultItems.length - 1];

  return {
    items: resultItems,
    nextCursor: hasMore && lastItem ? { seenAt: lastItem.seenAt, id: lastItem.id } : null,
    hasMore,
  };
}

// =============================================================================
// Collection Operations
// =============================================================================

export async function getAllCollections(): Promise<Collection[]> {
  const db = await getDB();
  const collections = await db.getAll(COLLECTIONS_STORE);

  collections.sort((a, b) => {
    if (a.isBuiltIn && !b.isBuiltIn) return -1;
    if (!a.isBuiltIn && b.isBuiltIn) return 1;
    return b.createdAt - a.createdAt;
  });

  return collections;
}

export async function createCollection(
  name: string,
  description?: string,
  color?: string,
  icon?: string
): Promise<Collection> {
  const db = await getDB();
  const now = Date.now();

  const collection: Collection = {
    id: crypto.randomUUID(),
    name,
    description,
    createdAt: now,
    updatedAt: now,
    color,
    icon,
    isBuiltIn: false,
  };

  await db.add(COLLECTIONS_STORE, collection);
  return collection;
}

export async function updateCollection(
  id: string,
  updates: Partial<Pick<Collection, "name" | "description" | "color" | "icon">>
): Promise<Collection> {
  const db = await getDB();
  const existing = await db.get(COLLECTIONS_STORE, id);

  if (!existing) {
    throw new Error("Collection not found");
  }

  if (existing.isBuiltIn && updates.name) {
    throw new Error("Cannot rename built-in collection");
  }

  const updated: Collection = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };

  await db.put(COLLECTIONS_STORE, updated);
  return updated;
}

export async function deleteCollection(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get(COLLECTIONS_STORE, id);

  if (!existing) {
    throw new Error("Collection not found");
  }

  if (existing.isBuiltIn) {
    throw new Error("Cannot delete built-in collection");
  }

  const tx = db.transaction([COLLECTIONS_STORE, COLLECTION_TWEETS_STORE], "readwrite");

  const index = tx.objectStore(COLLECTION_TWEETS_STORE).index("by-collection-id");
  let cursor = await index.openCursor(IDBKeyRange.only(id));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  await tx.objectStore(COLLECTIONS_STORE).delete(id);
  await tx.done;
}

// =============================================================================
// Tweet-Collection Association Operations
// =============================================================================

export async function addTweetToCollection(
  collectionId: string,
  tweetId: string,
  note?: string
): Promise<CollectionTweet> {
  const db = await getDB();

  const association: CollectionTweet = {
    id: `${collectionId}-${tweetId}`,
    collectionId,
    tweetId,
    addedAt: Date.now(),
    note,
  };

  await db.put(COLLECTION_TWEETS_STORE, association);

  const collection = await db.get(COLLECTIONS_STORE, collectionId);
  if (collection) {
    collection.updatedAt = Date.now();
    await db.put(COLLECTIONS_STORE, collection);
  }

  return association;
}

export async function removeTweetFromCollection(
  collectionId: string,
  tweetId: string
): Promise<void> {
  const db = await getDB();
  await db.delete(COLLECTION_TWEETS_STORE, `${collectionId}-${tweetId}`);
}

export async function getCollectionsForTweet(tweetId: string): Promise<Collection[]> {
  const db = await getDB();
  const tx = db.transaction([COLLECTION_TWEETS_STORE, COLLECTIONS_STORE], "readonly");

  const index = tx.objectStore(COLLECTION_TWEETS_STORE).index("by-tweet-id");
  const associations = await index.getAll(IDBKeyRange.only(tweetId));

  const collections: Collection[] = [];
  for (const assoc of associations) {
    const collection = await tx.objectStore(COLLECTIONS_STORE).get(assoc.collectionId);
    if (collection) collections.push(collection);
  }

  return collections;
}

// =============================================================================
// Favorites Operations
// =============================================================================

export async function isTweetFavorited(tweetId: string): Promise<boolean> {
  const db = await getDB();
  const assoc = await db.get(COLLECTION_TWEETS_STORE, `${FAVORITES_COLLECTION_ID}-${tweetId}`);
  return !!assoc;
}

export async function toggleFavorite(tweetId: string): Promise<boolean> {
  const isFavorited = await isTweetFavorited(tweetId);

  if (isFavorited) {
    await removeTweetFromCollection(FAVORITES_COLLECTION_ID, tweetId);
    return false;
  } else {
    await addTweetToCollection(FAVORITES_COLLECTION_ID, tweetId);
    return true;
  }
}
