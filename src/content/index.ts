import { parseTweetElement, findTweetArticles } from "../lib/tweet-parser";
import type { CapturedTweet, ExtensionMessage } from "../types";

// Configuration
const CAPTURE_DEBOUNCE_MS = 500;
const VIEWPORT_THRESHOLD = 0.5; // Tweet must be 50% visible

// Track captured tweet IDs to avoid re-processing
const capturedIds = new Set<string>();

// Queue of tweets to send to background
let captureQueue: CapturedTweet[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Send queued tweets to the background worker
 */
function flushQueue() {
  if (captureQueue.length === 0) return;

  const tweets = [...captureQueue];
  captureQueue = [];

  const message: ExtensionMessage = { type: "TWEETS_CAPTURED", tweets };
  chrome.runtime.sendMessage(message).catch((error) => {
    // Extension might not be ready yet
    console.debug("[Tweet Recall] Failed to send tweets:", error);
  });
}

/**
 * Process a tweet that entered the viewport
 */
function processTweet(article: Element) {
  const tweet = parseTweetElement(article);
  if (!tweet) return;

  // Skip if already captured
  if (capturedIds.has(tweet.id)) return;
  capturedIds.add(tweet.id);

  // Add to queue
  captureQueue.push(tweet);

  // Debounce sending to background
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(flushQueue, CAPTURE_DEBOUNCE_MS);
}

/**
 * Set up IntersectionObserver to track viewed tweets
 */
function createTweetObserver(): IntersectionObserver {
  return new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          processTweet(entry.target);
        }
      }
    },
    {
      threshold: VIEWPORT_THRESHOLD,
      rootMargin: "0px",
    },
  );
}

/**
 * Set up MutationObserver to detect new tweets added to DOM
 */
function createDomObserver(
  tweetObserver: IntersectionObserver,
): MutationObserver {
  return new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;

        // Check if the node itself is a tweet
        if (node.matches('article[data-testid="tweet"]')) {
          tweetObserver.observe(node);
        }

        // Check for tweets within the added subtree
        const tweets = node.querySelectorAll('article[data-testid="tweet"]');
        tweets.forEach((tweet) => tweetObserver.observe(tweet));
      }
    }
  });
}

/**
 * Initialize the content script
 */
function initialize() {
  console.log("[Tweet Recall] Content script initialized");

  // Create observers
  const tweetObserver = createTweetObserver();
  const domObserver = createDomObserver(tweetObserver);

  // Observe existing tweets
  const existingTweets = findTweetArticles();
  existingTweets.forEach((tweet) => tweetObserver.observe(tweet));
  console.log(
    `[Tweet Recall] Observing ${existingTweets.length} existing tweets`,
  );

  // Watch for new tweets
  domObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}
