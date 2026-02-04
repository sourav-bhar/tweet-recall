import {
  storeTweets,
  getAllTweets,
  getStats,
  clearAll,
  getTweetCount,
} from "../lib/db";
import {
  initializeIndex,
  addToIndex,
  searchTweets,
  clearIndex,
} from "../lib/search";
import type { ExtensionMessage, ExtensionResponse } from "../types";

// Initialize search index on startup
let indexReady = false;

async function initializeSearchIndex() {
  try {
    const tweets = await getAllTweets();
    initializeIndex(tweets);
    indexReady = true;
    console.log(
      `[Tweet Recall] Background worker ready with ${tweets.length} tweets`,
    );
  } catch (error) {
    console.error("[Tweet Recall] Failed to initialize index:", error);
  }
}

// Initialize on install/startup
chrome.runtime.onInstalled.addListener(() => {
  console.log("[Tweet Recall] Extension installed");
  initializeSearchIndex();
});

chrome.runtime.onStartup.addListener(() => {
  console.log("[Tweet Recall] Extension started");
  initializeSearchIndex();
});

// Also initialize immediately (for development reloads)
initializeSearchIndex();

/**
 * Handle messages from content script and popup
 */
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender,
    sendResponse: (response: ExtensionResponse) => void,
  ) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => {
        console.error("[Tweet Recall] Error handling message:", error);
        sendResponse({ type: "ERROR", message: String(error) });
      });

    // Return true to indicate async response
    return true;
  },
);

async function handleMessage(
  message: ExtensionMessage,
): Promise<ExtensionResponse> {
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
      // Ensure index is ready
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

    default:
      return { type: "ERROR", message: "Unknown message type" };
  }
}
