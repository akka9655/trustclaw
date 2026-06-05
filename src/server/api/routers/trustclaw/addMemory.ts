import { z } from "zod";
import { protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/clients/db";

export const addMemory = protectedProcedure
  .input(
    z.object({
      content: z.string().min(1).max(500),
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

    // Since we need an embedding to satisfy PostgreSQL schema constraints (VECTOR(1024) is not nullable),
    // we can generate a mock/dummy array of 1024 floats. Because we are in stateless automation mode,
    // we don't query via vector similarity search; we simply list all memories.
    const mockVector = Array(1024).fill(0.0);

    // Prisma's unsupported type query for PGVector insertion:
    await db.$executeRawUnsafe(
      `INSERT INTO "composio_claw_memory" ("id", "instanceId", "content", "embedding", "createdAt") 
       VALUES ($1, $2, $3, $4::vector, NOW())`,
      crypto.randomUUID(),
      instance.id,
      input.content,
      `[${mockVector.join(",")}]`
    );

    return { success: true };
  });
