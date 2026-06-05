import { protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/clients/db";

export const getStats = protectedProcedure.query(async ({ ctx }) => {
  const userId = ctx.session.user.id;

  const instance = await db.composioClawInstance.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!instance) {
    return {
      totalMessages: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      dailyMessages: [],
      memoryCount: 0,
      cronJobCount: 0,
    };
  }

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Aggregate total & today stats
  const [totalAgg, todayAgg, memoryCount, cronJobCount, recentMessages] = await Promise.all([
    db.message.aggregate({
      where: { instanceId: instance.id, role: "assistant" },
      _sum: { inputTokens: true, outputTokens: true },
      _count: { id: true },
    }),
    db.message.aggregate({
      where: {
        instanceId: instance.id,
        role: "assistant",
        createdAt: { gte: todayStart },
      },
      _sum: { inputTokens: true, outputTokens: true },
      _count: { id: true },
    }),
    db.memory.count({ where: { instanceId: instance.id } }),
    db.cronJob.count({ where: { instanceId: instance.id } }),
    db.message.findMany({
      where: {
        instanceId: instance.id,
        role: "assistant",
        createdAt: { gte: thirtyDaysAgo },
        messageType: "regular",
      },
      select: {
        createdAt: true,
        inputTokens: true,
        outputTokens: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Group by date
  const dailyMap = new Map<
    string,
    { count: number; inputTokens: number; outputTokens: number }
  >();

  for (const msg of recentMessages) {
    const dateKey = msg.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
    const existing = dailyMap.get(dateKey) ?? { count: 0, inputTokens: 0, outputTokens: 0 };
    dailyMap.set(dateKey, {
      count: existing.count + 1,
      inputTokens: existing.inputTokens + (msg.inputTokens ?? 0),
      outputTokens: existing.outputTokens + (msg.outputTokens ?? 0),
    });
  }

  const dailyMessages = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalMessages: totalAgg._count.id,
    totalInputTokens: totalAgg._sum.inputTokens ?? 0,
    totalOutputTokens: totalAgg._sum.outputTokens ?? 0,
    todayMessages: todayAgg._count.id,
    todayInputTokens: todayAgg._sum.inputTokens ?? 0,
    todayOutputTokens: todayAgg._sum.outputTokens ?? 0,
    dailyMessages,
    memoryCount,
    cronJobCount,
  };
});
