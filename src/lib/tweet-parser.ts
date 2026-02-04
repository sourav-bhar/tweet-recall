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

    // Check for quoted tweet - try multiple selectors as Twitter's DOM changes
    let quotedTweet = article.querySelector('[data-testid="quoteTweet"]');

    // Fallback: look for a nested tweet card (common quote tweet structure)
    if (!quotedTweet) {
      quotedTweet = article.querySelector('[data-testid="card.layoutLarge.media"]');
    }

    // Fallback: look for embedded tweet within a card wrapper
    if (!quotedTweet) {
      const cardWrapper = article.querySelector('[data-testid="card.wrapper"]');
      if (cardWrapper) {
        // Check if this card contains tweet-like content (has status link)
        const cardLink = cardWrapper.querySelector('a[href*="/status/"]');
        if (cardLink && cardWrapper.querySelector('[dir="auto"]')) {
          quotedTweet = cardWrapper;
        }
      }
    }

    // Fallback: look for quote tweet container by role
    if (!quotedTweet) {
      const nestedText = article.querySelector('[role="link"][tabindex="0"] [data-testid="tweetText"]');
      if (nestedText) {
        quotedTweet = nestedText.closest('[role="link"]');
      }
    }

    let quotedText: string | undefined;
    let quotedAuthor: string | undefined;

    if (quotedTweet) {
      // Try to get quoted tweet text
      const quotedTextEl = quotedTweet.querySelector(
        '[data-testid="tweetText"]',
      ) || quotedTweet.querySelector('[dir="auto"][lang]');
      quotedText = quotedTextEl?.textContent?.trim();

      // Try to get quoted author from status link
      const quotedAuthorEl = quotedTweet.querySelector('a[href*="/status/"]');
      const quotedHref = quotedAuthorEl?.getAttribute("href");
      if (quotedHref) {
        const quotedMatch = quotedHref.match(/\/([^/]+)\/status\//);
        if (quotedMatch) quotedAuthor = quotedMatch[1];
      }

      // Fallback 1: try to get author from any user profile link
      if (!quotedAuthor) {
        const userLinks = quotedTweet.querySelectorAll('a[href^="/"]');
        for (const link of userLinks) {
          const href = link.getAttribute("href");
          if (href && !href.includes("/status/") && !href.includes("/search") && !href.includes("/hashtag")) {
            const userMatch = href.match(/^\/([a-zA-Z0-9_]+)$/);
            if (userMatch) {
              quotedAuthor = userMatch[1];
              break;
            }
          }
        }
      }

      // Fallback 2: look for @username pattern in the quote tweet header area
      if (!quotedAuthor) {
        // Look for spans that might contain @handle
        const spans = quotedTweet.querySelectorAll('span');
        for (const span of spans) {
          const text = span.textContent?.trim() || "";
          // Match @username pattern
          const handleMatch = text.match(/^@([a-zA-Z0-9_]+)$/);
          if (handleMatch) {
            quotedAuthor = handleMatch[1];
            break;
          }
        }
      }

      // Fallback 3: extract from User-Name testid within quote tweet
      if (!quotedAuthor) {
        const userNameEl = quotedTweet.querySelector('[data-testid="User-Name"]');
        if (userNameEl) {
          // Look for the handle link within User-Name
          const handleLink = userNameEl.querySelector('a[href^="/"]');
          const href = handleLink?.getAttribute("href");
          if (href) {
            const userMatch = href.match(/^\/([a-zA-Z0-9_]+)$/);
            if (userMatch) quotedAuthor = userMatch[1];
          }
          // Or try to find @handle text
          if (!quotedAuthor) {
            const text = userNameEl.textContent || "";
            const handleMatch = text.match(/@([a-zA-Z0-9_]+)/);
            if (handleMatch) quotedAuthor = handleMatch[1];
          }
        }
      }

      // Fallback 4: look for any text containing @ in the first few elements
      if (!quotedAuthor) {
        const allText = quotedTweet.textContent || "";
        const handleMatch = allText.match(/@([a-zA-Z0-9_]+)/);
        if (handleMatch) {
          quotedAuthor = handleMatch[1];
        }
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
