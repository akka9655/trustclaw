import { z } from "zod";

export const createCronJobInput = z.object({
  expression: z.string().min(1, "Cron expression is required"),
  prompt: z.string().min(1, "Task description is required"),
});

export type CreateCronJobInput = z.infer<typeof createCronJobInput>;
