import { SOURCE_DOMAIN_MAP, type SourceTypeName } from "@/lib/constants";

export type ClassifiedCitation = {
  url: string;
  domain: string;
  sourceType: SourceTypeName;
};

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0]?.toLowerCase() ?? "";
  }
}

export function classifySource(url: string, brandDomains: string[] = []): ClassifiedCitation {
  const domain = hostnameOf(url);
  const brandSet = new Set(brandDomains.map((item) => item.toLowerCase().replace(/^www\./, "")));

  if (brandSet.has(domain)) {
    return { url, domain, sourceType: "brand_site" };
  }

  const mapped = SOURCE_DOMAIN_MAP[domain] ?? SOURCE_DOMAIN_MAP[`www.${domain}`];
  if (mapped) {
    return { url, domain, sourceType: mapped };
  }

  if (domain.includes("reddit.")) return { url, domain, sourceType: "reddit" };
  if (domain.includes("quora.")) return { url, domain, sourceType: "quora" };
  if (
    domain.endsWith("substack.com") ||
    domain.includes("medium.com") ||
    domain.includes("hashnode") ||
    domain.includes("ghost.io") ||
    domain.includes("blog")
  ) {
    return { url, domain, sourceType: "blog" };
  }

  return { url, domain, sourceType: "other" };
}

export function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)]+/g) ?? [];
  return [...new Set(matches.map((item) => item.replace(/[.,;]+$/, "")))];
}
