import { z } from "zod";

export const ALLOWED_ANTHROPIC_MODELS = [
  // Google (default — free, no limit concerns)
  "gemini-2.5-flash",
  // GitHub Models — GPT family
  "github-gpt-4.1-nano",
  "github-gpt-4.1-mini",
  "github-gpt-4o-mini",
  "github-gpt-4o",
  "github-o4-mini",
  // GitHub Models — Meta Llama
  "github-llama-3.1-8b-instruct",
  "github-llama-3.3-70b-instruct",
  // GitHub Models — Microsoft Phi (great for 4GB RAM / low-latency)
  "github-phi-4-mini-instruct",
  "github-phi-4",
  // GitHub Models — DeepSeek
  "github-deepseek-v3",
  "github-deepseek-r1",
  // GitHub Models — Mistral
  "github-mistral-small",
  // GitHub Models — xAI Grok
  "github-grok-3-mini",
] as const;

export const allowedAnthropicModelSchema = z.enum(ALLOWED_ANTHROPIC_MODELS);

export const createInstanceInput = z.object({
  anthropicModel: allowedAnthropicModelSchema.default(
    "gemini-2.5-flash",
  ),
});

export type CreateInstanceInput = z.infer<typeof createInstanceInput>;
