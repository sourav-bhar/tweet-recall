import type { CapturedTweet } from "../types";

/**
 * Parse a tweet article element from Twitter's DOM
 */
export function parseTweetElement(article: Element): CapturedTweet | null {
  try {
    // Find the tweet link to extract ID and author
    const tweetLink = article.querySelector(
      'a[href*="/status/"]',
    ) as HTMLAnchorElement | null;
    if (!tweetLink) return null;

    const href = tweetLink.getAttribute("href");
    if (!href) return null;

    // Extract tweet ID and author from URL: /{author}/status/{id}
    const match = href.match(/\/([^/]+)\/status\/(\d+)/);
    if (!match) return null;

    const [, author, id] = match;

    // Get tweet text - try multiple selectors for Twitter's dynamic structure
    const textElement = article.querySelector('[data-testid="tweetText"]');
    const text = textElement?.textContent?.trim() ?? "";

    // Skip if no meaningful text
    if (!text && !article.querySelector('[data-testid="tweetPhoto"]')) {
      return null;
    }

    // Get author display name
    const authorNameElement = article.querySelector(
      '[data-testid="User-Name"] a[role="link"] span',
    );
    const authorName = authorNameElement?.textContent?.trim() ?? author;

    // Get timestamp
    const timeElement = article.querySelector("time");
    const postedAt = timeElement?.dateTime
      ? new Date(timeElement.dateTime).getTime()
      : Date.now();

    // Check for media
    const hasMedia = !!(
      article.querySelector('[data-testid="tweetPhoto"]') ||
      article.querySelector('[data-testid="videoPlayer"]') ||
      article.querySelector('[data-testid="card.wrapper"]')
    );

    // Check if retweet
    const isRetweet = !!article
      .querySelector('[data-testid="socialContext"]')
      ?.textContent?.includes("reposted");

    // Check if thread (has "Show this thread" or reply indicator)
    const isThread = !!(
      article.querySelector('[data-testid="tweet-text-show-more-link"]') ||
      article.textContent?.includes("Show this thread")
    );

    // Check for quoted tweet
    const quotedTweet = article.querySelector('[data-testid="quoteTweet"]');
    let quotedText: string | undefined;
    let quotedAuthor: string | undefined;

    if (quotedTweet) {
      const quotedTextEl = quotedTweet.querySelector(
        '[data-testid="tweetText"]',
      );
      quotedText = quotedTextEl?.textContent?.trim();

      const quotedAuthorEl = quotedTweet.querySelector('a[href*="/status/"]');
      const quotedHref = quotedAuthorEl?.getAttribute("href");
      if (quotedHref) {
        const quotedMatch = quotedHref.match(/\/([^/]+)\/status\//);
        if (quotedMatch) quotedAuthor = quotedMatch[1];
      }
    }

    return {
      id,
      text,
      author,
      authorName,
      postedAt,
      seenAt: Date.now(),
      url: `https://x.com/${author}/status/${id}`,
      hasMedia,
      isRetweet,
      isThread,
      quotedText,
      quotedAuthor,
    };
  } catch (error) {
    console.error("[Tweet Recall] Error parsing tweet:", error);
    return null;
  }
}

/**
 * Find all tweet articles currently in the DOM
 */
export function findTweetArticles(): Element[] {
  return Array.from(document.querySelectorAll('article[data-testid="tweet"]'));
}
