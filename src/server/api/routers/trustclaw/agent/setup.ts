import { ToolLoopAgent, stepCountIs, wrapLanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { ToolSet, SystemModelMessage } from "ai";
import { db } from "~/server/clients/db";
import { createComposioClient } from "~/server/clients/composio";
import { buildSystemPrompt } from "./system-prompt";
import { createCustomTools } from "./tools";
import {
  toPlainRecordSafe,
  toPrismaJson,
  sanitizeString,
  deepSanitize,
} from "./context/build-context";
import { stripToolResultEchoes } from "./strip-tool-echoes";
import { clearStreamingMessage } from "~/server/clients/redis";

// ── Model step limits ─────────────────────────────────────────────────────────
// Gemini free tier: 5 RPM — cap at 3 steps + 13s delay between tool calls
// GitHub / Custom: much higher limits — allow 12 steps so automations complete
const GEMINI_FREE_TIER_MAX_STEPS = 3;
const GEMINI_STEP_DELAY_MS = 13_000; // 13s keeps us safely under 5 RPM
const GITHUB_MAX_STEPS = 12;
const CUSTOM_API_MAX_STEPS = 12;
// ─────────────────────────────────────────────────────────────────────────────

const google = createGoogleGenerativeAI();
const geminiModel = google("gemini-2.5-flash");

type MessageSource = "web" | "telegram" | "cron";

function truncateLargeToolOutput(value: unknown): unknown {
  if (typeof value === "string") {
    if (value.length > 2000) {
      return (
        value.slice(0, 1000) +
        "\n...[truncated]...\n" +
        value.slice(-500)
      );
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length > 10) {
      const truncated = value.slice(0, 10).map(truncateLargeToolOutput);
      truncated.push(`...[${value.length - 10} more items]...`);
      return truncated;
    }
    return value.map(truncateLargeToolOutput);
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = truncateLargeToolOutput(v);
    }
    return out;
  }
  return value;
}

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
          return deepSanitize(truncateLargeToolOutput(result));
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
  // Stateless: only the current user message — no history loaded
  messages: [{ role: "user"; content: string }];
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

  // Load manually added memory facts
  const dbMemories = await db.memory.findMany({
    where: { instanceId },
    select: { content: true },
    orderBy: { createdAt: "desc" },
  });
  const manualMemories = dbMemories.map((m) => m.content);

  // ── Lean system prompt with user-controlled manual memories ───────────────
  const systemPrompt = sanitizeString(
    buildSystemPrompt({
      soulPrompt: instance.soulPrompt,
      identityPrompt: instance.identityPrompt,
      userPrompt: instance.userPrompt,
      userTimezone,
      manualMemories,
    }),
  );

  // ── Save user message to DB (for history UI display only) ─────────────────
  await db.message.create({
    data: {
      instanceId,
      role: "user",
      content: [{ type: "text", text: userMessage }],
      source,
      ...(userMessageType && { messageType: userMessageType }),
    },
  });

  // ── Tools: Composio (500+ services) + Schedule + Deploy ───────────────────
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

  // ── Create DB row for assistant reply ─────────────────────────────────────
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

  // ── Resolve model ──────────────────────────────────────────────────────────
  const GITHUB_MODEL_ID_MAP: Record<string, string> = {
    "github-gpt-4.1-nano":           "gpt-4.1-nano",
    "github-gpt-4.1-mini":           "gpt-4.1-mini",
    "github-gpt-4o-mini":            "gpt-4o-mini",
    "github-gpt-4o":                 "gpt-4o",
    "github-o4-mini":                "o4-mini",
    "github-llama-3.1-8b-instruct":  "meta/llama-3.1-8b-instruct",
    "github-llama-3.3-70b-instruct": "meta/llama-3.3-70b-instruct",
    "github-phi-4-mini-instruct":    "microsoft/phi-4-mini-instruct",
    "github-phi-4":                  "microsoft/phi-4",
    "github-deepseek-v3":            "deepseek/deepseek-v3",
    "github-deepseek-r1":            "deepseek/deepseek-r1",
    "github-mistral-small":          "mistral-ai/mistral-small",
    "github-grok-3-mini":            "xai/grok-3-mini",
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let agentModel: any = geminiModel;
  const isGemini =
    !instance.customApiUrl &&
    !instance.anthropicModel?.startsWith("github-");

  if (instance.customApiUrl && instance.customApiKey) {
    const customOpenai = createOpenAI({
      baseURL: instance.customApiUrl,
      apiKey: instance.customApiKey,
    });
    agentModel = customOpenai(instance.customApiModel ?? "gpt-4o");
  } else if (instance.anthropicModel?.startsWith("github-")) {
    const githubKey =
      process.env.GITHUB_MODELS_API_KEY ?? process.env.GITHUB_TOKEN;
    if (!githubKey) {
      throw new Error(
        "GitHub Models API key missing. Add GITHUB_MODELS_API_KEY to Vercel environment variables.",
      );
    }
    const resolvedId =
      GITHUB_MODEL_ID_MAP[instance.anthropicModel] ?? "gpt-4o-mini";
    console.log(`[agent/setup] GitHub Models → ${resolvedId}`);
    const githubOpenai = createOpenAI({
      baseURL: "https://models.inference.ai.azure.com",
      apiKey: githubKey,
    });
    agentModel = githubOpenai(resolvedId);
  }

  // ── Step limits ────────────────────────────────────────────────────────────
  const maxSteps = isGemini
    ? GEMINI_FREE_TIER_MAX_STEPS
    : instance.customApiUrl
    ? CUSTOM_API_MAX_STEPS
    : GITHUB_MAX_STEPS;

  // Gemini free tier: add 13s delay between tool-call steps only (not first stream)
  const resolvedAgentModel = isGemini
    ? wrapLanguageModel({
        model: agentModel,
        middleware: {
          specificationVersion: "v3",
          // Delay tool-call follow-up generate() steps only.
          // The initial stream() is not affected so simple replies feel instant.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          wrapGenerate: async ({ doGenerate, doStream, params, model }) => {
            await new Promise((r) => setTimeout(r, GEMINI_STEP_DELAY_MS));
            return doGenerate();
          },
        },
      })
    : agentModel;

  // ── Build agent ────────────────────────────────────────────────────────────
  const agent = new ToolLoopAgent({
    model: resolvedAgentModel,
    instructions: {
      role: "system",
      content: systemPrompt,
    } satisfies SystemModelMessage,
    tools: allTools,
    // GitHub/Custom: 12 steps so complex multi-tool automations complete fully
    // Gemini free: 3 steps max (5 RPM hard limit)
    stopWhen: stepCountIs(maxSteps),
    onFinish: async (result) => {
      try {
        const { totalUsage, steps } = result;
        const inputTokens = totalUsage.inputTokens ?? 0;
        const outputTokens = totalUsage.outputTokens ?? 0;

        const assistantParts: Array<Record<string, unknown>> = [];

        for (const step of steps) {
          for (let i = 0; i < step.toolCalls.length; i++) {
            const tc = step.toolCalls[i]!;
            const tr = step.toolResults[i];
            assistantParts.push({
              type: "dynamic-tool" as const,
              toolCallId: tc.toolCallId,
              toolName: tc.toolName,
              state: tr ? "output-available" : "input-available",
              input: toPlainRecordSafe(tc.input),
              output: tr ? toPlainRecordSafe(tr.output) : {},
            });
          }

          const stepText = stripToolResultEchoes(step.text) || step.text;
          if (stepText?.trim()) {
            assistantParts.push({ type: "text" as const, text: stepText });
          }
        }

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
            cacheReadTokens: 0,
            cacheWriteTokens: 0,
          },
        });
      } catch (error) {
        console.error("[agent/onFinish] failed:", error);
      } finally {
        await clearStreamingMessage(instanceId).catch((e) =>
          console.error("[agent/onFinish] clearStreamingMessage failed:", e),
        );
      }
    },
  });

  // Stateless: only current user message, no history
  const messages = [{ role: "user" as const, content: userMessage }] as [
    { role: "user"; content: string },
  ];

  return {
    status: "ready",
    result: { agent, messages },
  };
}

export type {
  PrepareAgentRunParams,
  PrepareResult,
  PrepareAgentRunResult,
  MessageSource,
};