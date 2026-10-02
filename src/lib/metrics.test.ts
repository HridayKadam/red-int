import { describe, expect, it } from "vitest";
import { extractMentions } from "@/lib/extraction/mentions";
import { computeMetrics, computeShareOfVoice } from "@/lib/metrics";
import { classifySource } from "@/lib/extraction/sources";

const entities = [
  { name: "Lumen AI", aliases: ["Lumen"], isBrand: true },
  { name: "Northstar Notes", aliases: ["Northstar"], isBrand: false },
  { name: "HiveMemo", aliases: [], isBrand: false },
];

describe("extractMentions", () => {
  it("ranks by first appearance and matches aliases", () => {
    const text =
      "Northstar Notes leads most threads. HiveMemo is second. Lumen is mentioned later.";
    const mentions = extractMentions(text, entities);
    expect(mentions.map((item) => item.entityName)).toEqual([
      "Northstar Notes",
      "HiveMemo",
      "Lumen AI",
    ]);
    expect(mentions[2]?.isBrand).toBe(true);
    expect(mentions[2]?.rank).toBe(3);
  });

  it("is case-insensitive", () => {
    const mentions = extractMentions("lumen ai is the clear starting point.", entities);
    expect(mentions[0]?.entityName).toBe("Lumen AI");
    expect(mentions[0]?.rank).toBe(1);
  });
});

describe("metrics", () => {
  it("computes share of voice from tracked-entity mentions", () => {
    const mentions = [
      { entityName: "Lumen AI", isBrand: true, rank: 1 },
      { entityName: "Northstar Notes", isBrand: false, rank: 2 },
      { entityName: "HiveMemo", isBrand: false, rank: 1 },
    ];
    expect(computeShareOfVoice(mentions)).toBeCloseTo(1 / 3, 4);
  });

  it("computes named rate, avg rank, and brand-site citations", () => {
    const metrics = computeMetrics(
      [
        {
          promptId: "a",
          mentions: [
            { entityName: "Lumen AI", isBrand: true, rank: 2 },
            { entityName: "Northstar Notes", isBrand: false, rank: 1 },
          ],
          citations: [{ domain: "lumen-ai.example", sourceType: "brand_site" }],
        },
        {
          promptId: "b",
          mentions: [{ entityName: "HiveMemo", isBrand: false, rank: 1 }],
          citations: [{ domain: "reddit.com", sourceType: "reddit" }],
        },
      ],
      2,
      ["lumen-ai.example"],
    );
    expect(metrics.namedCount).toBe(1);
    expect(metrics.namedRate).toBe(0.5);
    expect(metrics.avgRank).toBe(2);
    expect(metrics.citationsEarned).toBe(1);
    expect(metrics.shareOfVoice).toBeCloseTo(1 / 3, 4);
  });
});

describe("classifySource", () => {
  it("maps reddit, directories, and brand domains", () => {
    expect(classifySource("https://www.reddit.com/r/saas/comments/x", []).sourceType).toBe("reddit");
    expect(classifySource("https://www.g2.com/products/northstar", []).sourceType).toBe("directory");
    expect(classifySource("https://lumen-ai.example/blog/notes", ["lumen-ai.example"]).sourceType).toBe(
      "brand_site",
    );
  });
});
