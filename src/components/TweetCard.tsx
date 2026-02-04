import { memo } from "react";
import {
  Star,
  ExternalLink,
  Image,
  Repeat2,
  MessageSquare,
  Quote,
  ChevronDown,
  ChevronUp,
  FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatFullDate } from "@/shared/utils/formatting";
import type { CapturedTweet, SearchResult } from "@/types";

interface TweetCardProps {
  tweet: CapturedTweet | SearchResult;
  isFavorited?: boolean;
  isSelected?: boolean;
  isExpanded?: boolean;
  showMedia?: boolean;
  variant?: "compact" | "expanded";
  onFavoriteClick?: () => void;
  onExpandClick?: () => void;
  onAddToCollection?: () => void;
  onClick?: () => void;
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 45%)`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const TweetCard = memo(function TweetCard({
  tweet,
  isFavorited = false,
  isSelected = false,
  isExpanded = false,
  showMedia = false,
  variant = "compact",
  onFavoriteClick,
  onExpandClick,
  onAddToCollection,
  onClick,
}: TweetCardProps) {
  const avatarColor = stringToColor(tweet.author);
  const initials = getInitials(tweet.authorName);
  const isLongText = tweet.text.length > 200;
  const shouldTruncate = variant === "compact" && isLongText && !isExpanded;

  return (
    <article
      className={cn(
        "tweet-card relative flex gap-2.5 p-2.5 cursor-pointer transition-colors hover:bg-secondary/50",
        isSelected && "bg-secondary border-l-2 border-l-primary"
      )}
      onClick={onClick}
      role="option"
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
    >
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
        style={{ backgroundColor: avatarColor }}
      >
        {initials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-1 flex-wrap mb-0.5">
          <span className="font-semibold text-sm text-foreground truncate">
            {tweet.authorName}
          </span>
          <span className="text-xs text-muted-foreground">
            @{tweet.author}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span
            className="text-xs text-muted-foreground"
            title={formatFullDate(tweet.seenAt)}
          >
            {formatRelativeTime(tweet.seenAt)}
          </span>

          {/* Add to Collection button */}
          {onAddToCollection && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCollection();
              }}
              title="Add to collection"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Favorite button */}
          {onFavoriteClick && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6",
                isFavorited && "text-yellow-500",
                !onAddToCollection && "ml-auto"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteClick();
              }}
              title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Star
                className={cn("h-3.5 w-3.5", isFavorited && "fill-current")}
              />
            </Button>
          )}

          {/* External link - in header to avoid overlap */}
          <a
            href={tweet.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors",
              !onFavoriteClick && !onAddToCollection && "ml-auto"
            )}
            onClick={(e) => e.stopPropagation()}
            title="Open on X"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Text */}
        <p
          className={cn(
            "text-[13px] leading-snug text-foreground whitespace-pre-wrap wrap-break-word",
            shouldTruncate && "line-clamp-3"
          )}
        >
          {tweet.text}
        </p>

        {/* Expand button */}
        {variant === "compact" && isLongText && onExpandClick && (
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-primary text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onExpandClick();
            }}
          >
            {isExpanded ? (
              <>
                Show less <ChevronUp className="h-2.5 w-2.5 ml-0.5" />
              </>
            ) : (
              <>
                Show more <ChevronDown className="h-2.5 w-2.5 ml-0.5" />
              </>
            )}
          </Button>
        )}

        {/* Media Grid */}
        {showMedia && tweet.mediaUrls && tweet.mediaUrls.length > 0 && (
          <div
            className={cn(
              "mt-2 grid gap-0.5 rounded-lg overflow-hidden",
              tweet.mediaUrls.length === 1 && "grid-cols-1",
              tweet.mediaUrls.length === 2 && "grid-cols-2",
              tweet.mediaUrls.length >= 3 && "grid-cols-2 grid-rows-2"
            )}
          >
            {tweet.mediaUrls.slice(0, 4).map((url, index) => (
              <div
                key={index}
                className="relative aspect-video bg-muted overflow-hidden"
              >
                <img
                  src={url}
                  alt={`Tweet media ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {index === 3 && tweet.mediaUrls && tweet.mediaUrls.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xl">
                    +{tweet.mediaUrls.length - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quoted tweet */}
        {tweet.quotedText && (
          <div className="mt-1.5 p-1.5 rounded-md border border-border bg-muted/30">
            <div className="flex items-center gap-1 mb-0.5 text-muted-foreground">
              <Quote className="h-2.5 w-2.5" />
              <span className="text-[10px]">@{tweet.quotedAuthor || "unknown"}</span>
            </div>
            <p className="text-[11px] text-foreground line-clamp-2">
              {tweet.quotedText}
            </p>
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {tweet.hasMedia && (
            <Badge variant="secondary" className="text-[10px] py-0 h-4 px-1.5">
              <Image className="h-2.5 w-2.5 mr-0.5" />
              Media
            </Badge>
          )}
          {tweet.isRetweet && (
            <Badge variant="secondary" className="text-[10px] py-0 h-4 px-1.5">
              <Repeat2 className="h-2.5 w-2.5 mr-0.5" />
              Retweet
            </Badge>
          )}
          {tweet.isThread && (
            <Badge variant="secondary" className="text-[10px] py-0 h-4 px-1.5">
              <MessageSquare className="h-2.5 w-2.5 mr-0.5" />
              Thread
            </Badge>
          )}
          {tweet.quotedText && (
            <Badge variant="secondary" className="text-[10px] py-0 h-4 px-1.5">
              <Quote className="h-2.5 w-2.5 mr-0.5" />
              Quote
            </Badge>
          )}
        </div>

        {/* Expanded footer */}
        {variant === "expanded" && (
          <div className="mt-3 pt-2 border-t border-border flex gap-4 text-xs text-muted-foreground">
            <span>Posted: {formatFullDate(tweet.postedAt)}</span>
            <span>Seen: {formatFullDate(tweet.seenAt)}</span>
          </div>
        )}
      </div>
    </article>
  );
});
