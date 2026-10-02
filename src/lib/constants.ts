export const APP_NAME = "Redlify Visibility Console";
export const WORDMARK = "redlify";

export const COOKIE_BRAND = "redlify_brand";
export const COOKIE_MODE = "redlify_mode";

export const DEFAULT_MODELS = ["gpt-4o-mini"] as const;
export const DEFAULT_BATCH_SIZE = 6;
export const RUN_CONCURRENCY = 3;

export const NAV_ITEMS = [
  { href: "/", label: "Overview", match: "exact" },
  { href: "/prompts", label: "Prompts", match: "prefix" },
  { href: "/diagnose", label: "Diagnose", match: "prefix" },
  { href: "/publish", label: "Publish", match: "prefix" },
  { href: "/recheck", label: "Re-check", match: "prefix" },
  { href: "/report", label: "Report", match: "prefix" },
  { href: "/settings", label: "Settings", match: "prefix" },
] as const;

export const SOURCE_DOMAIN_MAP: Record<string, SourceTypeName> = {
  "reddit.com": "reddit",
  "www.reddit.com": "reddit",
  "old.reddit.com": "reddit",
  "quora.com": "quora",
  "www.quora.com": "quora",
  "g2.com": "directory",
  "www.g2.com": "directory",
  "capterra.com": "directory",
  "www.capterra.com": "directory",
  "producthunt.com": "directory",
  "www.producthunt.com": "directory",
  "getapp.com": "directory",
  "www.getapp.com": "directory",
  "trustpilot.com": "directory",
  "www.trustpilot.com": "directory",
  "trustradius.com": "directory",
  "www.trustradius.com": "directory",
  "softwareadvice.com": "directory",
  "www.softwareadvice.com": "directory",
  "medium.com": "blog",
  "substack.com": "blog",
  "techcrunch.com": "news",
  "www.techcrunch.com": "news",
  "theverge.com": "news",
  "www.theverge.com": "news",
  "wired.com": "news",
  "www.wired.com": "news",
  "forbes.com": "news",
  "www.forbes.com": "news",
};

export type SourceTypeName =
  | "reddit"
  | "quora"
  | "blog"
  | "directory"
  | "brand_site"
  | "news"
  | "other";

export type PromptIntent = "discovery" | "comparison" | "alternatives" | "how_to";
export type RunKind = "baseline" | "recheck";
export type ContentTypeName =
  | "onsite_blog"
  | "offsite_blog"
  | "reddit_answer"
  | "quora_answer"
  | "directory_listing";

export const CONTENT_TYPE_LABELS: Record<ContentTypeName, string> = {
  onsite_blog: "On-site blog",
  offsite_blog: "Off-site blog",
  reddit_answer: "Reddit answer",
  quora_answer: "Quora answer",
  directory_listing: "Directory listing",
};

export const INTENT_LABELS: Record<PromptIntent, string> = {
  discovery: "Discovery",
  comparison: "Comparison",
  alternatives: "Alternatives",
  how_to: "How-to",
};

export const TONES = ["helpful", "direct", "analyst", "warm"] as const;
