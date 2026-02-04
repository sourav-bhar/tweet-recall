import type { TweetFilters } from "../../types";
import { getIconHtml } from "./Icons";

export interface FilterChip {
  /** Display label */
  label: string;
  /** Filter key to remove */
  key: keyof TweetFilters;
  /** Optional value for the filter */
  value?: string | number | boolean;
}

export interface FilterChipsOptions {
  /** Callback when a chip is removed */
  onRemove?: (key: keyof TweetFilters) => void;
}

/**
 * Convert filters to displayable chips
 */
export function filtersToChips(filters: TweetFilters): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.author) {
    chips.push({
      label: `from:@${filters.author}`,
      key: "author",
      value: filters.author,
    });
  }

  if (filters.hasMedia === true) {
    chips.push({
      label: "Has media",
      key: "hasMedia",
      value: true,
    });
  }

  if (filters.isRetweet === true) {
    chips.push({
      label: "Retweets",
      key: "isRetweet",
      value: true,
    });
  }

  if (filters.isThread === true) {
    chips.push({
      label: "Threads",
      key: "isThread",
      value: true,
    });
  }

  if (filters.isQuoteTweet === true) {
    chips.push({
      label: "Quote tweets",
      key: "isQuoteTweet",
      value: true,
    });
  }

  if (filters.seenAfter) {
    chips.push({
      label: `After ${formatDateShort(filters.seenAfter)}`,
      key: "seenAfter",
      value: filters.seenAfter,
    });
  }

  if (filters.seenBefore) {
    chips.push({
      label: `Before ${formatDateShort(filters.seenBefore)}`,
      key: "seenBefore",
      value: filters.seenBefore,
    });
  }

  if (filters.collectionId && filters.collectionId !== "__favorites__") {
    chips.push({
      label: "In collection",
      key: "collectionId",
      value: filters.collectionId,
    });
  }

  return chips;
}

/**
 * Format timestamp as short date
 */
function formatDateShort(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  // If same year, omit year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Render filter chips container
 */
export function renderFilterChips(
  chips: FilterChip[],
  options: FilterChipsOptions = {}
): HTMLElement {
  const container = document.createElement("div");
  container.className = "filter-chips";

  if (chips.length === 0) {
    return container;
  }

  chips.forEach((chip) => {
    const chipEl = document.createElement("button");
    chipEl.className = "filter-chip";
    chipEl.setAttribute("aria-label", `Remove filter: ${chip.label}`);

    chipEl.innerHTML = `
      <span class="filter-chip__label">${chip.label}</span>
      ${getIconHtml("x", { size: 12, className: "filter-chip__remove" })}
    `;

    if (options.onRemove) {
      chipEl.addEventListener("click", () => {
        options.onRemove!(chip.key);
      });
    }

    container.appendChild(chipEl);
  });

  return container;
}

/**
 * Create a single filter chip element
 */
export function createFilterChip(
  chip: FilterChip,
  onRemove?: () => void
): HTMLElement {
  const chipEl = document.createElement("button");
  chipEl.className = "filter-chip";
  chipEl.setAttribute("aria-label", `Remove filter: ${chip.label}`);

  chipEl.innerHTML = `
    <span class="filter-chip__label">${chip.label}</span>
    ${getIconHtml("x", { size: 12, className: "filter-chip__remove" })}
  `;

  if (onRemove) {
    chipEl.addEventListener("click", onRemove);
  }

  return chipEl;
}
