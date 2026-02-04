import {
  storeTweets,
  getAllTweets,
  getStats,
  clearAll,
  getTweetCount,
  getAuthors,
  queryTweets,
  getAllCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  addTweetToCollection,
  removeTweetFromCollection,
  getCollectionsForTweet,
  toggleFavorite,
  isTweetFavorited,
} from "../lib/db";
import {
  initializeIndex,
  addToIndex,
  searchTweets,
  clearIndex,
  searchWithFilters,
} from "../lib/search";
import type { ExtensionMessage, ExtensionResponse } from "../types";

let indexReady = false;

async function initializeSearchIndex() {
  try {
    const tweets = await getAllTweets();
    initializeIndex(tweets);
    indexReady = true;
    console.log(`[Tweet Recall] Background worker ready with ${tweets.length} tweets`);
  } catch (error) {
    console.error("[Tweet Recall] Failed to initialize index:", error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("[Tweet Recall] Extension installed");
  initializeSearchIndex();
});

chrome.runtime.onStartup.addListener(() => {
  console.log("[Tweet Recall] Extension started");
  initializeSearchIndex();
});

initializeSearchIndex();

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender,
    sendResponse: (response: ExtensionResponse) => void
  ) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => {
        console.error("[Tweet Recall] Error handling message:", error);
        sendResponse({ type: "ERROR", message: String(error) });
      });

    return true;
  }
);

async function handleMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
  switch (message.type) {
    case "TWEETS_CAPTURED": {
      const newCount = await storeTweets(message.tweets);
      if (newCount > 0) {
        addToIndex(message.tweets);
        console.log(`[Tweet Recall] Stored ${newCount} new tweets`);
      }
      const totalStored = await getTweetCount();
      return { type: "SEARCH_RESULTS", results: [], totalStored };
    }

    case "SEARCH_TWEETS": {
      if (!indexReady) {
        await initializeSearchIndex();
      }
      const results = searchTweets(message.query);
      const totalStored = await getTweetCount();
      return { type: "SEARCH_RESULTS", results, totalStored };
    }

    case "GET_STATS": {
      const stats = await getStats();
      return { type: "STATS", stats };
    }

    case "CLEAR_ALL": {
      await clearAll();
      clearIndex();
      indexReady = false;
      return { type: "CLEARED" };
    }

    case "EXPORT_DATA": {
      const data = await getAllTweets();
      return { type: "EXPORTED", data };
    }

    case "BROWSE_TWEETS": {
      const data = await queryTweets(message.filters, message.cursor, message.limit ?? 50);
      return { type: "BROWSE_RESULTS", data };
    }

    case "SEARCH_WITH_FILTERS": {
      if (!indexReady) {
        await initializeSearchIndex();
      }
      const data = await searchWithFilters(
        message.query,
        message.filters,
        message.cursor,
        message.limit ?? 50
      );
      return { type: "SEARCH_FILTER_RESULTS", data };
    }

    case "GET_AUTHORS": {
      const authors = await getAuthors();
      return { type: "AUTHORS", authors };
    }

    case "GET_COLLECTIONS": {
      const collections = await getAllCollections();
      return { type: "COLLECTIONS", collections };
    }

    case "CREATE_COLLECTION": {
      const collection = await createCollection(
        message.name,
        message.description,
        message.color,
        message.icon
      );
      return { type: "COLLECTION_CREATED", collection };
    }

    case "UPDATE_COLLECTION": {
      const collection = await updateCollection(message.id, message.updates);
      return { type: "COLLECTION_UPDATED", collection };
    }

    case "DELETE_COLLECTION": {
      await deleteCollection(message.id);
      return { type: "COLLECTION_DELETED" };
    }

    case "ADD_TO_COLLECTION": {
      const association = await addTweetToCollection(
        message.collectionId,
        message.tweetId,
        message.note
      );
      return { type: "ADDED_TO_COLLECTION", association };
    }

    case "REMOVE_FROM_COLLECTION": {
      await removeTweetFromCollection(message.collectionId, message.tweetId);
      return { type: "REMOVED_FROM_COLLECTION" };
    }

    case "GET_TWEET_COLLECTIONS": {
      const collections = await getCollectionsForTweet(message.tweetId);
      return { type: "TWEET_COLLECTIONS", collections };
    }

    case "TOGGLE_FAVORITE": {
      const isFavorited = await toggleFavorite(message.tweetId);
      return { type: "FAVORITE_TOGGLED", isFavorited };
    }

    case "IS_FAVORITED": {
      const isFavorited = await isTweetFavorited(message.tweetId);
      return { type: "IS_FAVORITED_RESULT", isFavorited };
    }

    default:
      return { type: "ERROR", message: "Unknown message type" };
  }
}
