import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/clients/db";

export const generateWebhookToken = protectedProcedure.mutation(async ({ ctx }) => {
  const userId = ctx.session.user.id;

  const instance = await db.composioClawInstance.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!instance) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Basi-jarvis instance not found",
    });
  }

  const token = crypto.randomUUID();

  await db.composioClawInstance.update({
    where: { userId },
    data: {
      webhookToken: token,
    },
  });

  return { token };
});
