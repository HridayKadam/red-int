export const COOKIE_BRAND = "redlify_brand";
export const COOKIE_MODE = "redlify_mode";

export type AppMode = "demo" | "live";

export function parseMode(value: string | undefined | null): AppMode {
  return value === "live" ? "live" : "demo";
}
