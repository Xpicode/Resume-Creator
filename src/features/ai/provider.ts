import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { serverEnv } from "@/lib/env";
import { AI_FEATURES, type AiFeature } from "./config";

/**
 * The only file that talks to the AI provider (plan 7.1). Swap models in config.ts.
 * The AI has no tools and no other data (plan 7.3); output must match a JSON schema.
 */

export type Usage = { input: number; output: number; model: string };
export type AiCall<T> =
  | { ok: true; data: T; usage: Usage }
  | { ok: false; reason: "refused" | "invalid" | "error"; usage: Usage };

let client: Anthropic | undefined;

export function aiConfigured(): boolean {
  return Boolean(serverEnv().ANTHROPIC_API_KEY);
}

function getClient(): Anthropic {
  client ??= new Anthropic({
    apiKey: serverEnv().ANTHROPIC_API_KEY,
    maxRetries: 2,
    timeout: 90_000,
  });
  return client;
}

/** One structured call; invalid output is retried once, then reported (plan 7.3). */
export async function callClaude<T>(
  feature: AiFeature,
  prompt: { system: string; user: string },
  schema: z.ZodType<T>,
): Promise<AiCall<T>> {
  const cfg = AI_FEATURES[feature];
  const usage: Usage = { input: 0, output: 0, model: cfg.model };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await getClient().beta.messages.parse({
        model: cfg.model,
        max_tokens: cfg.maxTokens,
        system: prompt.system,
        messages: [{ role: "user", content: prompt.user }],
        output_config: { effort: cfg.effort, format: betaZodOutputFormat(schema) },
        // Server-side refusal fallback where the model supports it (Sonnet 5.5 on the Claude API).
        ...(cfg.fallback
          ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
          : {}),
      });
      usage.input += res.usage.input_tokens;
      usage.output += res.usage.output_tokens;
      usage.model = res.model;

      // Check why it stopped before reading content.
      if (res.stop_reason === "refusal") return { ok: false, reason: "refused", usage };
      if (res.stop_reason === "max_tokens") continue;
      const parsed = schema.safeParse(res.parsed_output);
      if (parsed.success) return { ok: true, data: parsed.data, usage };
    } catch (e) {
      if (e instanceof Anthropic.APIError) {
        // The SDK already retried 429/5xx/connection errors. Log status only — never prompt or output (plan 6.8).
        console.error("ai call failed", feature, e.status);
        return { ok: false, reason: "error", usage };
      }
      // Output that didn't match the schema: try once more.
    }
  }
  return { ok: false, reason: "invalid", usage };
}
