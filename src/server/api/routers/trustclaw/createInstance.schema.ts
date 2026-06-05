import { z } from "zod";

export const ALLOWED_ANTHROPIC_MODELS = [
  "claude-opus-4-6",
  "claude-sonnet-4-6-20251120",
  "claude-sonnet-4-5-20250929",
  "claude-3-7-sonnet-20250219",
  "claude-haiku-4-5-20251001",
  "claude-3-5-haiku-20241022",
] as const;

export const allowedAnthropicModelSchema = z.enum(ALLOWED_ANTHROPIC_MODELS);

export const createInstanceInput = z.object({
  anthropicModel: allowedAnthropicModelSchema.default(
    "claude-sonnet-4-5-20250929",
  ),
});

export type CreateInstanceInput = z.infer<typeof createInstanceInput>;
