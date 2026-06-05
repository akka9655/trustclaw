import { ToolLoopAgent, stepCountIs } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { ToolSet, SystemModelMessage } from "ai";
import { db } from "~/server/clients/db";
import { createComposioClient } from "~/server/clients/composio";
import { buildSystemPrompt } from "./system-prompt";
import {
  createCustomTools,
  searchMemoriesForContext,
} from "./tools";
import { pruneContext } from "./context/context-pruning";
import {
  loadContextMessages,
  buildContext,
  toPlainRecordSafe,
  toPrismaJson,
  runPostResponseTasks,
  sanitizeString,
  deepSanitize,
} from "./context/build-context";
import {
  DEFAULT_COMPACTION_SETTINGS,
  type CompactionSettings,
} from "./context/token-estimation";
import { stripToolResultEchoes } from "./strip-tool-echoes";
import { clearStreamingMessage } from "~/server/clients/redis";
import type { ReconstructedMessage } from "./types";

// ── Gemini client ─────────────────────────────────────────────────────────────
const google = createGoogleGenerativeAI();
const geminiModel = google("gemini-2.5-flash");
// ─────────────────────────────────────────────────────────────────────────────

type MessageSource = "web" | "telegram" | "cron";

function sanitizeToolResults(tools: ToolSet): ToolSet {
  const wrapped: ToolSet = {};
  for (const [name, tool] of Object.entries(tools)) {
    if (tool.execute) {
      const originalExecute = tool.execute;
      wrapped[name] = {
        ...tool,
        execute: async (...args: Parameters<typeof originalExecute>) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const result = await originalExecute(...args);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return deepSanitize(result);
        },
      };
    } else {
      wrapped[name] = tool;
    }
  }
  return wrapped;
}

interface PrepareAgentRunParams {
  instanceId: string;
  userMessage: string;
  source: MessageSource;
  userMessageType?: "hidden";
}

interface PrepareAgentRunResult {
  agent: ToolLoopAgent;
  messages: ReconstructedMessage[];
}

type PrepareResult = { status: "ready"; result: PrepareAgentRunResult };

export async function prepareAgentRun(
  params: PrepareAgentRunParams,
): Promise<PrepareResult> {
  const { instanceId, userMessage, source, userMessageType } = params;

  const instance = await db.composioClawInstance.findUnique({
    where: { id: instanceId },
  });

  if (!instance) {
    throw new Error("Instance not found");
  }

  const user = await db.user.findUnique({
    where: { id: instance.userId },
    select: { timezone: true },
  });

  const userTimezone = user?.timezone ?? "UTC";

  const relevantMemories = await searchMemoriesForContext(instanceId, userMessage);

  const systemPrompt = sanitizeString(
    buildSystemPrompt({
      soulPrompt: instance.soulPrompt,
      identityPrompt: instance.identityPrompt,
      userPrompt: instance.userPrompt,
      relevantMemories,
      hasCompactionSummary: !!instance.lastCompactionSummary,
      userTimezone,
    }),
  );

  const dbMessages = await loadContextMessages(
    instanceId,
    instance.lastCompactionAt,
  );
  const aiMessages = buildContext(
    dbMessages,
    instance.lastCompactionSummary,
    userMessage,
  );

  // Trigger compaction/memory flush at 4k tokens to rigorously conserve Gemini 2.5 Flash free-tier limits
  const contextWindow = 4_000;
  const { messages: prunedMessages } = pruneContext(aiMessages, contextWindow);

  await db.message.create({
    data: {
      instanceId,
      role: "user",
      content: [{ type: "text", text: userMessage }],
      source,
      ...(userMessageType && { messageType: userMessageType }),
    },
  });

  const composio = createComposioClient();
  const session = await composio.create(instance.userId, {
    manageConnections: {
      waitForConnections: true,
    },
  });
  const composioTools = await session.tools();

  const customTools = createCustomTools(instanceId, userTimezone);

  const allTools: ToolSet = sanitizeToolResults({
    ...composioTools,
    ...customTools,
  });

  const assistantMessageRow = await db.message.create({
    data: {
      instanceId,
      role: "assistant",
      content: toPrismaJson([]),
      source,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    },
  });

  const agent = new ToolLoopAgent({
    model: geminiModel,
    instructions: {
      role: "system",
      content: systemPrompt,
    } satisfies SystemModelMessage,
    tools: allTools,
    stopWhen: stepCountIs(15), // Limited to 15 steps for Hobby plan token conservation
    onFinish: async (result) => {
      try {
        const { totalUsage, steps } = result;
        const inputTokens = totalUsage.inputTokens ?? 0;
        const outputTokens = totalUsage.outputTokens ?? 0;
        const cacheReadTokens = 0;
        const cacheWriteTokens = 0;

        const assistantParts: Array<Record<string, unknown>> = [];

        for (const step of steps) {
          for (let i = 0; i < step.toolCalls.length; i++) {
            const tc = step.toolCalls[i]!;
            const tr = step.toolResults[i];
            const tcInput = toPlainRecordSafe(tc.input);
            const tcResult = tr ? toPlainRecordSafe(tr.output) : null;

            assistantParts.push({
              type: "dynamic-tool" as const,
              toolCallId: tc.toolCallId,
              toolName: tc.toolName,
              state: tcResult ? "output-available" : "input-available",
              input: tcInput,
              output: tcResult ?? {},
            });
          }

          // ── Fix: use || so empty string also falls back to raw step.text ──
          const stepText = stripToolResultEchoes(step.text) || step.text;
          if (stepText?.trim()) {
            assistantParts.push({ type: "text" as const, text: stepText });
          }
        }

        // ── Fix: final fallback if assistantParts is still empty ──
        if (assistantParts.length === 0) {
          const lastStep = steps[steps.length - 1];
          if (lastStep?.text?.trim()) {
            assistantParts.push({ type: "text" as const, text: lastStep.text });
          }
        }

        await db.message.update({
          where: { id: assistantMessageRow.id },
          data: {
            content: toPrismaJson(assistantParts),
            inputTokens,
            outputTokens,
            cacheReadTokens,
            cacheWriteTokens,
          },
        });

        const totalContextTokens = inputTokens + outputTokens;
        const settings: CompactionSettings = {
          contextWindow,
          ...DEFAULT_COMPACTION_SETTINGS,
        };

        void runPostResponseTasks({
          instanceId,
          instance: {
            anthropicModel: instance.anthropicModel,
            compactionCount: instance.compactionCount,
            memoryFlushCount: instance.memoryFlushCount,
            lastCompactionSummary: instance.lastCompactionSummary,
            lastCompactionAt: instance.lastCompactionAt,
          },
          contextTokens: totalContextTokens,
          settings,
          prunedMessages,
        });
      } catch (error) {
        console.error("[agent/onFinish] post-stream processing failed:", error);
      } finally {
        await clearStreamingMessage(instanceId).catch((error) =>
          console.error(
            "[agent/onFinish] clearStreamingMessage failed:",
            error,
          ),
        );
      }
    },
  });

  return {
    status: "ready",
    result: {
      agent,
      messages: prunedMessages,
    },
  };
}

export type {
  PrepareAgentRunParams,
  PrepareResult,
  PrepareAgentRunResult,
  MessageSource,
};
