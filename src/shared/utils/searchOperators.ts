import type { TweetFilters } from "../../types";

/**
 * Parsed search query with extracted operators
 */
export interface ParsedSearch {
  /** Remaining text query after operator extraction */
  query: string;
  /** Filters extracted from operators */
  filters: TweetFilters;
}

/**
 * Supported search operators:
 * - from:username - Filter by author handle
 * - has:media - Only tweets with media
 * - has:quote - Only quote tweets
 * - is:retweet - Only retweets
 * - is:thread - Only thread tweets
 * - before:YYYY-MM-DD - Seen before date
 * - after:YYYY-MM-DD - Seen after date
 */

const OPERATORS = {
  from: parseFromOperator,
  has: parseHasOperator,
  is: parseIsOperator,
  before: parseBeforeOperator,
  after: parseAfterOperator,
} as const;

type OperatorKey = keyof typeof OPERATORS;

/**
 * Parse search query and extract operators
 */
export function parseSearchQuery(input: string): ParsedSearch {
  const filters: TweetFilters = {};
  let query = input;

  // Match all operators in the format "operator:value"
  const operatorRegex = /(\w+):(\S+)/g;
  const matches: Array<{ full: string; operator: string; value: string }> = [];

  let match;
  while ((match = operatorRegex.exec(input)) !== null) {
    matches.push({
      full: match[0],
      operator: match[1].toLowerCase(),
      value: match[2],
    });
  }

  // Process each operator
  for (const { full, operator, value } of matches) {
    if (operator in OPERATORS) {
      const parser = OPERATORS[operator as OperatorKey];
      parser(value, filters);
      // Remove the operator from the query
      query = query.replace(full, "").trim();
    }
  }

  // Clean up multiple spaces
  query = query.replace(/\s+/g, " ").trim();

  return { query, filters };
}

/**
 * Parse from: operator (author filter)
 */
function parseFromOperator(value: string, filters: TweetFilters): void {
  // Remove @ prefix if present
  filters.author = value.replace(/^@/, "").toLowerCase();
}

/**
 * Parse has: operator (media, quote)
 */
function parseHasOperator(value: string, filters: TweetFilters): void {
  switch (value.toLowerCase()) {
    case "media":
    case "image":
    case "video":
      filters.hasMedia = true;
      break;
    case "quote":
    case "quoted":
      filters.isQuoteTweet = true;
      break;
  }
}

/**
 * Parse is: operator (retweet, thread)
 */
function parseIsOperator(value: string, filters: TweetFilters): void {
  switch (value.toLowerCase()) {
    case "retweet":
    case "rt":
      filters.isRetweet = true;
      break;
    case "thread":
      filters.isThread = true;
      break;
  }
}

/**
 * Parse before: operator (date filter)
 */
function parseBeforeOperator(value: string, filters: TweetFilters): void {
  const date = parseDate(value);
  if (date) {
    filters.seenBefore = date;
  }
}

/**
 * Parse after: operator (date filter)
 */
function parseAfterOperator(value: string, filters: TweetFilters): void {
  const date = parseDate(value);
  if (date) {
    filters.seenAfter = date;
  }
}

/**
 * Parse a date string in YYYY-MM-DD format to Unix timestamp
 */
function parseDate(value: string): number | null {
  // Support relative dates
  const relativeDates: Record<string, () => number> = {
    today: () => startOfDay(new Date()).getTime(),
    yesterday: () => startOfDay(subtractDays(new Date(), 1)).getTime(),
    "7d": () => startOfDay(subtractDays(new Date(), 7)).getTime(),
    "30d": () => startOfDay(subtractDays(new Date(), 30)).getTime(),
    week: () => startOfDay(subtractDays(new Date(), 7)).getTime(),
    month: () => startOfDay(subtractDays(new Date(), 30)).getTime(),
  };

  if (value.toLowerCase() in relativeDates) {
    return relativeDates[value.toLowerCase()]();
  }

  // Try parsing as YYYY-MM-DD
  const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date.getTime();
    }
  }

  return null;
}

/**
 * Get start of day (midnight)
 */
function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Subtract days from a date
 */
function subtractDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

/**
 * Format filter state as human-readable chips
 */
export function formatFiltersAsChips(filters: TweetFilters): string[] {
  const chips: string[] = [];

  if (filters.author) {
    chips.push(`from:@${filters.author}`);
  }
  if (filters.hasMedia) {
    chips.push("has:media");
  }
  if (filters.isRetweet) {
    chips.push("is:retweet");
  }
  if (filters.isThread) {
    chips.push("is:thread");
  }
  if (filters.isQuoteTweet) {
    chips.push("has:quote");
  }
  if (filters.seenAfter) {
    chips.push(`after:${formatDateForChip(filters.seenAfter)}`);
  }
  if (filters.seenBefore) {
    chips.push(`before:${formatDateForChip(filters.seenBefore)}`);
  }
  if (filters.collectionId) {
    chips.push(
      filters.collectionId === "__favorites__"
        ? "in:favorites"
        : `in:collection`
    );
  }

  return chips;
}

/**
 * Format date for display in filter chip
 */
function formatDateForChip(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toISOString().split("T")[0];
}

/**
 * Merge two filter objects
 */
export function mergeFilters(
  base: TweetFilters,
  override: TweetFilters
): TweetFilters {
  return {
    ...base,
    ...override,
    // For date filters, use the more restrictive one
    seenAfter:
      base.seenAfter && override.seenAfter
        ? Math.max(base.seenAfter, override.seenAfter)
        : base.seenAfter || override.seenAfter,
    seenBefore:
      base.seenBefore && override.seenBefore
        ? Math.min(base.seenBefore, override.seenBefore)
        : base.seenBefore || override.seenBefore,
  };
}
