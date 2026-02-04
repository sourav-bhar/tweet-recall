import type { CapturedTweet, SearchResult } from "../../types";
import { escapeHtml, stringToColor, getInitials } from "../utils/dom";
import { formatRelativeTime, formatFullDate } from "../utils/formatting";
import { getIconHtml } from "./Icons";

export type TweetCardVariant = "compact" | "expanded";

export interface TweetCardOptions {
  /** Card variant - compact for popup, expanded for fullpage */
  variant?: TweetCardVariant;
  /** Whether to show the favorite button */
  showFavorite?: boolean;
  /** Whether this tweet is favorited */
  isFavorited?: boolean;
  /** Callback when favorite button is clicked */
  onFavoriteClick?: (tweetId: string, event: Event) => void;
  /** Whether to show the add to collection button */
  showAddToCollection?: boolean;
  /** Callback when add to collection button is clicked */
  onAddToCollectionClick?: (tweetId: string, event: Event) => void;
  /** Whether the card is currently selected (keyboard nav) */
  isSelected?: boolean;
  /** Whether text is expanded (for expandable cards) */
  isTextExpanded?: boolean;
  /** Callback when expand button is clicked */
  onExpandClick?: (tweetId: string, event: Event) => void;
}

/**
 * Render a tweet card element
 */
export function renderTweetCard(
  tweet: CapturedTweet | SearchResult,
  options: TweetCardOptions = {}
): HTMLElement {
  const {
    variant = "compact",
    showFavorite = true,
    isFavorited = false,
    onFavoriteClick,
    showAddToCollection = false,
    onAddToCollectionClick,
    isSelected = false,
    isTextExpanded = false,
    onExpandClick,
  } = options;

  const card = document.createElement("article");
  card.className = `tweet-card tweet-card--${variant}${isSelected ? " tweet-card--selected" : ""}`;
  card.setAttribute("data-tweet-id", tweet.id);
  card.setAttribute("role", "option");
  card.setAttribute("aria-selected", String(isSelected));
  card.setAttribute(
    "aria-label",
    `Tweet by ${tweet.authorName} @${tweet.author}, ${formatRelativeTime(tweet.seenAt)}. ${tweet.text.substring(0, 100)}${tweet.text.length > 100 ? "..." : ""}`
  );
  card.tabIndex = isSelected ? 0 : -1;

  // Avatar
  const avatarColor = stringToColor(tweet.author);
  const initials = getInitials(tweet.authorName);

  // Build card HTML
  card.innerHTML = `
    <div class="tweet-card__main">
      <div class="tweet-card__avatar" style="background-color: ${avatarColor}">
        ${initials}
      </div>
      <div class="tweet-card__content">
        <div class="tweet-card__header">
          <span class="tweet-card__author-name">${escapeHtml(tweet.authorName)}</span>
          <span class="tweet-card__author-handle">@${escapeHtml(tweet.author)}</span>
          <span class="tweet-card__separator">·</span>
          <span class="tweet-card__time" title="${formatFullDate(tweet.seenAt)}">
            ${formatRelativeTime(tweet.seenAt)}
          </span>
          ${showAddToCollection ? `
            <button
              class="tweet-card__collection-btn"
              aria-label="Add to collection"
              data-tweet-id="${tweet.id}"
              title="Add to collection"
            >
              ${getIconHtml("folder", { size: 16 })}
            </button>
          ` : ""}
          ${showFavorite ? `
            <button
              class="tweet-card__favorite ${isFavorited ? "is-favorited" : ""}"
              aria-label="${isFavorited ? "Remove from favorites" : "Add to favorites"}"
              data-tweet-id="${tweet.id}"
            >
              ${getIconHtml(isFavorited ? "star-filled" : "star", { size: 16, filled: isFavorited })}
            </button>
          ` : ""}
        </div>
        <div class="tweet-card__text ${isTextExpanded ? "tweet-card__text--expanded" : ""}">
          ${escapeHtml(tweet.text)}
        </div>
        ${tweet.text.length > 200 && variant === "compact" ? `
          <button class="tweet-card__expand-btn" data-tweet-id="${tweet.id}">
            ${isTextExpanded ? "Show less" : "Show more"}
          </button>
        ` : ""}
        ${variant === "expanded" ? renderMediaGrid(tweet) : ""}
        ${renderQuotedTweet(tweet)}
        <div class="tweet-card__meta">
          ${renderBadges(tweet)}
        </div>
        ${variant === "expanded" ? renderExpandedFooter(tweet) : ""}
      </div>
    </div>
    <a href="${tweet.url}" target="_blank" rel="noopener" class="tweet-card__link" aria-label="Open tweet on X">
      ${getIconHtml("external-link", { size: 14 })}
    </a>
  `;

  // Add event listeners
  if (showFavorite && onFavoriteClick) {
    const favoriteBtn = card.querySelector(".tweet-card__favorite");
    if (favoriteBtn) {
      favoriteBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        onFavoriteClick(tweet.id, e);
      });
    }
  }

  if (showAddToCollection && onAddToCollectionClick) {
    const collectionBtn = card.querySelector(".tweet-card__collection-btn");
    if (collectionBtn) {
      collectionBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        onAddToCollectionClick(tweet.id, e);
      });
    }
  }

  if (onExpandClick) {
    const expandBtn = card.querySelector(".tweet-card__expand-btn");
    if (expandBtn) {
      expandBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        onExpandClick(tweet.id, e);
      });
    }
  }

  return card;
}

/**
 * Render media grid (images/video thumbnails) for expanded view
 */
function renderMediaGrid(tweet: CapturedTweet | SearchResult): string {
  if (!tweet.mediaUrls || tweet.mediaUrls.length === 0) return "";

  const mediaCount = tweet.mediaUrls.length;
  const gridClass = mediaCount === 1 ? "single" : mediaCount === 2 ? "double" : "multi";

  const mediaItems = tweet.mediaUrls.slice(0, 4).map((url, index) => {
    // For the 4th image when there are more, show a "+N" overlay
    const showOverlay = index === 3 && mediaCount > 4;
    const overlayCount = mediaCount - 4;

    return `
      <div class="tweet-card__media-item">
        <img src="${escapeHtml(url)}" alt="Tweet media ${index + 1}" loading="lazy" />
        ${showOverlay ? `<div class="tweet-card__media-overlay">+${overlayCount}</div>` : ""}
      </div>
    `;
  }).join("");

  return `
    <div class="tweet-card__media tweet-card__media--${gridClass}">
      ${mediaItems}
    </div>
  `;
}

/**
 * Render quoted tweet section
 */
function renderQuotedTweet(tweet: CapturedTweet | SearchResult): string {
  if (!tweet.quotedText) return "";

  return `
    <div class="tweet-card__quoted">
      <div class="tweet-card__quoted-header">
        ${getIconHtml("quote", { size: 12 })}
        <span class="tweet-card__quoted-author">@${escapeHtml(tweet.quotedAuthor || "unknown")}</span>
      </div>
      <div class="tweet-card__quoted-text">${escapeHtml(tweet.quotedText)}</div>
    </div>
  `;
}

/**
 * Render metadata badges
 */
function renderBadges(tweet: CapturedTweet | SearchResult): string {
  const badges: string[] = [];

  if (tweet.hasMedia) {
    badges.push(`
      <span class="tweet-card__badge" aria-label="Has media">
        ${getIconHtml("media", { size: 14 })}
        <span>Media</span>
      </span>
    `);
  }

  if (tweet.isRetweet) {
    badges.push(`
      <span class="tweet-card__badge" aria-label="Retweet">
        ${getIconHtml("retweet", { size: 14 })}
        <span>Retweet</span>
      </span>
    `);
  }

  if (tweet.isThread) {
    badges.push(`
      <span class="tweet-card__badge" aria-label="Thread">
        ${getIconHtml("thread", { size: 14 })}
        <span>Thread</span>
      </span>
    `);
  }

  if (tweet.quotedText) {
    badges.push(`
      <span class="tweet-card__badge" aria-label="Quote tweet">
        ${getIconHtml("quote", { size: 14 })}
        <span>Quote</span>
      </span>
    `);
  }

  return badges.join("");
}

/**
 * Render expanded footer (for fullpage view)
 */
function renderExpandedFooter(tweet: CapturedTweet | SearchResult): string {
  return `
    <div class="tweet-card__footer">
      <div class="tweet-card__timestamps">
        <span>Posted: ${formatFullDate(tweet.postedAt)}</span>
        <span>Seen: ${formatFullDate(tweet.seenAt)}</span>
      </div>
    </div>
  `;
}

/**
 * Update favorite state on existing card
 */
export function updateCardFavoriteState(
  card: HTMLElement,
  isFavorited: boolean
): void {
  const btn = card.querySelector(".tweet-card__favorite");
  if (!btn) return;

  if (isFavorited) {
    btn.classList.add("is-favorited");
    btn.setAttribute("aria-label", "Remove from favorites");
  } else {
    btn.classList.remove("is-favorited");
    btn.setAttribute("aria-label", "Add to favorites");
  }

  btn.innerHTML = getIconHtml(isFavorited ? "star-filled" : "star", {
    size: 16,
    filled: isFavorited,
  });
}

/**
 * Update selected state on card
 */
export function updateCardSelectedState(
  card: HTMLElement,
  isSelected: boolean
): void {
  if (isSelected) {
    card.classList.add("tweet-card--selected");
    card.setAttribute("aria-selected", "true");
    card.tabIndex = 0;
  } else {
    card.classList.remove("tweet-card--selected");
    card.setAttribute("aria-selected", "false");
    card.tabIndex = -1;
  }
}
