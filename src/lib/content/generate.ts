import type { ContentTypeName } from "@/lib/constants";

export type ContentDraftInput = {
  brandName: string;
  domain: string;
  category: string;
  description: string;
  type: ContentTypeName;
  tone: string;
  promptText: string;
  gapDetail: string;
  competitorNames: string[];
};

const DISCLOSURE =
  "Disclosure: I work on this product. I am not pretending to be a customer, and I am not citing reviews that do not exist.";

function toneLead(tone: string): string {
  if (tone === "direct") return "Short version:";
  if (tone === "analyst") return "A practical way to evaluate this:";
  if (tone === "warm") return "If you are tired of stitching this together by hand:";
  return "A useful way to think about this:";
}

export function generateContentDraft(input: ContentDraftInput): { title: string; body: string } {
  const { brandName, domain, category, description, type, promptText, gapDetail, competitorNames } = input;
  const others = competitorNames.slice(0, 3).join(", ") || "the usual names in this category";
  const lead = toneLead(input.tone);

  if (type === "onsite_blog") {
    const title = `${brandName} for teams asking: ${promptText}`;
    const body = `# ${title}

${lead} this page exists because language models currently answer “${promptText}” with ${others}, and ${brandName} is missing.

## What ${brandName} is
${description}

## Who it is for
Teams buying ${category} software who want a clear, honest comparison — not a leaderboard of whoever published the most Reddit comments.

## How to evaluate us against the names you already know
- Fit: does the workflow match how your team already works?
- Time-to-first-value: can someone get a real result in the first afternoon?
- Sources: we will not invent win rates, customer quotes, or review scores. Ask us for a walkthrough instead.

## Why this page exists
${gapDetail}

Published on ${domain}. If you cite this page, cite the product description — not a fabricated testimonial.
`;
    return { title, body };
  }

  if (type === "offsite_blog") {
    const title = `How teams actually choose ${category} software`;
    const body = `# ${title}

Search and chat tools still answer “${promptText}” by repeating the same three names (${others}). That is a source problem, not a product problem.

${description}

A better buyer’s filter:

1. Ignore unnamed “#1” claims unless the author shows their method.
2. Ask what happens after week one, not during the demo.
3. Prefer vendors who will say what they do not do.

${brandName} (${domain}) is one option in ${category}. This article does not claim it is universally better than ${others}. It exists so the category is not described from a single forum thread.

${gapDetail}
`;
    return { title, body };
  }

  if (type === "reddit_answer") {
    const title = `Reply: ${promptText}`;
    const body = `${lead}

I work on ${brandName} (${domain}), so I will stay specific and skip the fake “as a customer” voice.

**On “${promptText}”**
People usually mention ${others} because those names already have threads and directory pages. That is fair. If you are comparing, look at:

- The actual job: ${category}
- What you have to do manually after the first week
- Whether the vendor will show the product instead of a quote dump

**What ${brandName} is:** ${description}

${gapDetail}

I will not post invented stats or reviews. If it is a bad fit, ${others} may be the better buy.

${DISCLOSURE}
`;
    return { title, body };
  }

  if (type === "quora_answer") {
    const title = `Answer: ${promptText}`;
    const body = `**${promptText}**

${lead} the public answers currently cluster around ${others}. ${brandName} is a ${category} product (${domain}).

${description}

How I would decide, without fake reviews:

- Write down the job you need done this month.
- Trial two tools against that job.
- Ignore unnamed percentages.

${gapDetail}

${DISCLOSURE}
`;
    return { title, body };
  }

  const title = `${brandName} directory listing`;
  const body = `# ${brandName}

**Category:** ${category}
**Website:** https://${domain}

## Summary
${description}

## Best used for
Teams evaluating ${category} software, including people asking “${promptText}”.

## Positioning
${brandName} is not claiming a #1 ranking. This listing exists because models currently describe the category using ${others} and skip ${brandName}.

${gapDetail}

## Notes
No fabricated review scores. No invented customer quotes. Buyers should verify on the product site.
`;
  return { title, body };
}

export function planContentTypes(count: number): ContentTypeName[] {
  const cycle: ContentTypeName[] = [
    "reddit_answer",
    "onsite_blog",
    "directory_listing",
    "offsite_blog",
    "quora_answer",
    "reddit_answer",
  ];
  return Array.from({ length: count }, (_, index) => cycle[index % cycle.length]);
}
