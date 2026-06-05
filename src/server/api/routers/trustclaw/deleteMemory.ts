import { z } from "zod";
import { protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/clients/db";

export const deleteMemory = protectedProcedure
  .input(
    z.object({
      memoryId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const instance = await db.composioClawInstance.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!instance) {
      throw new Error("Claw instance not found");
    }

    // Verify ownership and delete the memory row
    const memory = await db.memory.findFirst({
      where: {
        id: input.memoryId,
        instanceId: instance.id,
      },
    });

    if (!memory) {
      throw new Error("Memory not found or not owned by you");
    }

    await db.memory.delete({
      where: {
        id: input.memoryId,
      },
    });

    return { success: true };
  });
