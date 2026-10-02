import type { AppMode } from "@/lib/cookies";
import type { ContentTypeName, PromptIntent, SourceTypeName } from "@/lib/constants";

export type BrandSummary = {
  id: string;
  name: string;
  domain: string;
  category: string;
  description: string;
};

export type CompetitorSummary = {
  id: string;
  name: string;
  domain: string;
};

export type PromptRow = {
  id: string;
  text: string;
  intent: PromptIntent;
  results: Array<{
    runId: string;
    kind: "baseline" | "recheck";
    model: string;
    named: boolean;
    rank: number | null;
    sentiment: string | null;
  }>;
};

export type MentionView = {
  entityName: string;
  isBrand: boolean;
  rank: number;
  sentiment: string;
};

export type CitationView = {
  url: string;
  domain: string;
  sourceType: SourceTypeName;
};

export type AnswerDetail = {
  id: string;
  rawText: string;
  model: string;
  mentions: MentionView[];
  citations: CitationView[];
};

export type MetricSnapshot = {
  runId: string;
  kind: "baseline" | "recheck";
  model: string;
  createdAt: string;
  shareOfVoice: number;
  namedCount: number;
  promptCount: number;
  avgRank: number | null;
  citationsEarned: number;
  isDemo: boolean;
};

export type LeaderboardRow = {
  name: string;
  isBrand: boolean;
  mentions: number;
  shareOfVoice: number;
};

export type ContentView = {
  id: string;
  type: ContentTypeName;
  title: string;
  body: string;
  targetPromptIds: string[];
  status: "draft" | "approved" | "published";
  publishedUrl: string | null;
  tone: string;
  disclosure: boolean;
  createdAt: string;
};

export type InsightView = {
  id: string;
  kind: string;
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
  promptIds: string[];
};

export type { AppMode, ContentTypeName, PromptIntent, SourceTypeName };
