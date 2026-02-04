/**
 * SVG Icon components for Tweet Recall
 */

export type IconName =
  | "media"
  | "retweet"
  | "thread"
  | "quote"
  | "star"
  | "star-filled"
  | "search"
  | "settings"
  | "folder"
  | "plus"
  | "x"
  | "chevron-down"
  | "external-link"
  | "expand"
  | "collapse"
  | "calendar"
  | "user"
  | "check";

function getIconPath(name: IconName): string {
  switch (name) {
    case "media":
      return "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z";
    case "retweet":
      return "M23.77 15.67a.749.749 0 0 0-1.06 0l-2.22 2.22V7.65a3.755 3.755 0 0 0-3.75-3.75h-5.85a.75.75 0 0 0 0 1.5h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22a.749.749 0 1 0-1.06 1.06l3.5 3.5c.145.147.337.22.53.22s.383-.072.53-.22l3.5-3.5a.747.747 0 0 0 0-1.06zm-10.66 3.28H7.26c-1.24 0-2.25-1.01-2.25-2.25V6.46l2.22 2.22a.752.752 0 0 0 1.062-.01.749.749 0 0 0-.002-1.05l-3.5-3.5a.747.747 0 0 0-1.06 0l-3.5 3.5a.749.749 0 1 0 1.06 1.06l2.22-2.22V16.7a3.755 3.755 0 0 0 3.75 3.75h5.85a.75.75 0 0 0 0-1.5z";
    case "thread":
      return "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71";
    case "quote":
      return "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z M8 9h8 M8 13h4";
    case "star":
      return "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";
    case "star-filled":
      return "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";
    case "search":
      return "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z";
    case "settings":
      return "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z";
    case "folder":
      return "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z";
    case "plus":
      return "M12 5v14 M5 12h14";
    case "x":
      return "M18 6L6 18 M6 6l12 12";
    case "chevron-down":
      return "M6 9l6 6 6-6";
    case "external-link":
      return "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6 M15 3h6v6 M10 14L21 3";
    case "expand":
      return "M15 3h6v6 M9 21H3v-6 M21 3l-7 7 M3 21l7-7";
    case "collapse":
      return "M4 14h6v6 M20 10h-6V4 M14 10l7-7 M3 21l7-7";
    case "calendar":
      return "M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18";
    case "user":
      return "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z";
    case "check":
      return "M20 6L9 17l-5-5";
    default:
      return "";
  }
}

export function createIcon(
  name: IconName,
  options: {
    size?: number;
    className?: string;
    ariaLabel?: string;
    filled?: boolean;
  } = {}
): SVGElement {
  const { size = 16, className = "", ariaLabel, filled = false } = options;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", filled ? "currentColor" : "none");
  svg.setAttribute("stroke", filled ? "none" : "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  if (className) {
    svg.setAttribute("class", className);
  }

  if (ariaLabel) {
    svg.setAttribute("aria-label", ariaLabel);
    svg.setAttribute("role", "img");
  } else {
    svg.setAttribute("aria-hidden", "true");
  }

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", getIconPath(name));
  svg.appendChild(path);

  return svg;
}

export function getIconHtml(
  name: IconName,
  options: {
    size?: number;
    className?: string;
    ariaLabel?: string;
    filled?: boolean;
  } = {}
): string {
  const { size = 16, className = "", ariaLabel, filled = false } = options;

  const ariaAttrs = ariaLabel
    ? `aria-label="${ariaLabel}" role="img"`
    : 'aria-hidden="true"';

  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${filled ? "currentColor" : "none"}" stroke="${filled ? "none" : "currentColor"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${className ? `class="${className}"` : ""} ${ariaAttrs}><path d="${getIconPath(name)}"></path></svg>`;
}
