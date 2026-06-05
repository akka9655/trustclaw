import { z } from "zod";

export const updateCustomApiInput = z.object({
  customApiUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  customApiKey: z.string().optional(),
  customApiModel: z.string().min(1, "Model name is required").or(z.literal("")).optional(),
  /** Pass true to clear the custom API config entirely */
  clear: z.boolean().optional(),
});

export type UpdateCustomApiInput = z.infer<typeof updateCustomApiInput>;
