import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/clients/db";
import { createCronJobInput } from "./createCronJob.schema";
import { computeNextRunSafe } from "./agent/tools/cron-utils";

export const createCronJob = protectedProcedure
  .input(createCronJobInput)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const [instance, user] = await Promise.all([
      db.composioClawInstance.findUnique({
        where: { userId },
        select: { id: true },
      }),
      db.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
      }),
    ]);

    if (!instance) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Basi-jarvis instance not found",
      });
    }

    const timezone = user?.timezone ?? "UTC";
    const nextRunAt = computeNextRunSafe(input.expression, timezone);

    if (!nextRunAt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid cron expression or no future runs detected",
      });
    }

    const cronJob = await db.cronJob.create({
      data: {
        instanceId: instance.id,
        expression: input.expression,
        prompt: input.prompt,
        timezone,
        nextRunAt,
      },
    });

    return cronJob;
  });
