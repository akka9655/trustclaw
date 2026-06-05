import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/clients/db";
import { updateCustomApiInput } from "./updateCustomApi.schema";

export const updateCustomApi = protectedProcedure
  .input(updateCustomApiInput)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const instance = await db.composioClawInstance.findUnique({
      where: { userId },
    });

    if (!instance) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "TrustClaw instance not found",
      });
    }

    if (input.clear) {
      await db.composioClawInstance.update({
        where: { userId },
        data: {
          customApiUrl: null,
          customApiKey: null,
          customApiModel: null,
        },
      });
      return { cleared: true };
    }

    await db.composioClawInstance.update({
      where: { userId },
      data: {
        ...(input.customApiUrl !== undefined && {
          customApiUrl: input.customApiUrl === "" ? null : input.customApiUrl,
        }),
        ...(input.customApiKey !== undefined && {
          customApiKey: input.customApiKey === "" ? null : input.customApiKey,
        }),
        ...(input.customApiModel !== undefined && {
          customApiModel: input.customApiModel === "" ? null : input.customApiModel,
        }),
      },
    });

    return { updated: true };
  });
