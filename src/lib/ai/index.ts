import { MockProvider } from "@/lib/ai/mock-provider";
import { OpenAIProvider } from "@/lib/ai/openai-provider";
import type { AIProvider } from "@/lib/ai/provider";
import type { AppMode } from "@/lib/cookies";

export function isLiveConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim());
}

export function demoModeFromEnv(): boolean {
  return process.env.DEMO_MODE !== "false";
}

export function getProvider(mode: AppMode, model = "gpt-4o-mini"): AIProvider {
  if (mode === "live") {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) {
      throw new Error("Live Mode needs OPENAI_API_KEY. Demo Mode works without a key.");
    }
    return new OpenAIProvider(key, model);
  }
  return new MockProvider();
}
