import { z } from "zod";

export const getStatsOutput = z.object({
  totalMessages: z.number(),
  totalInputTokens: z.number(),
  totalOutputTokens: z.number(),
  dailyMessages: z.array(
    z.object({
      date: z.string(),
      count: z.number(),
      inputTokens: z.number(),
      outputTokens: z.number(),
    }),
  ),
  memoryCount: z.number(),
  cronJobCount: z.number(),
});

export type GetStatsOutput = z.infer<typeof getStatsOutput>;
