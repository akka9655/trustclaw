import { smoothStream, UI_MESSAGE_STREAM_HEADERS } from "ai";
import { z } from "zod";
import { auth } from "~/server/auth";
import { db } from "~/server/clients/db";
import { prepareAgentRun } from "~/server/api/routers/trustclaw/agent/setup";
import {
  setStreamingMessage,
  getStreamingMessage,
} from "~/server/clients/redis";
import { rateLimit } from "~/server/clients/rate-limit";
import { getStreamContext } from "./stream-store";
import { TRPCError } from "@trpc/server";

const chatRequestBody = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string().optional(),
      parts: z.array(z.record(z.unknown())).optional(),
    }),
  ),
});

async function getAuthenticatedInstance(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const userId = session.user.id;
  const instance = await db.composioClawInstance.findUnique({
    where: { userId },
    select: { id: true, userId: true },
  });

  if (!instance) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  return { userId, instanceId: instance.id };
}

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const authResult = await getAuthenticatedInstance(request);
    const { instanceId, userId } = authResult;

    const body = chatRequestBody.safeParse(await request.json());
    if (!body.success) {
      return new Response("Invalid request body", { status: 400 });
    }

    const lastUserMessage = [...body.data.messages]
      .reverse()
      .find((m) => m.role === "user");

    // Extract text from parts array (structured format) OR fall back to plain content string
    let userText = "";
    if (lastUserMessage?.parts && lastUserMessage.parts.length > 0) {
      userText = lastUserMessage.parts
        .filter(
          (p): p is { type: string; text: string } =>
            typeof p === "object" &&
            p !== null &&
            "type" in p &&
            p.type === "text" &&
            "text" in p &&
            typeof p.text === "string",
        )
        .map((p) => p.text)
        .join("\n");
    }

    // Fallback: plain string content (e.g. simple "Hi" messages)
    if (!userText && typeof lastUserMessage?.content === "string") {
      userText = lastUserMessage.content;
    }

    if (!userText.trim()) {
      return new Response("Empty message", { status: 400 });
    }

    const limit = await rateLimit(userId, "chat");
    if (!limit.allowed) {
      return new Response(JSON.stringify({ error: "rate_limit_exceeded" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(limit.retryAfterSeconds),
        },
      });
    }

    const prepareResult = await prepareAgentRun({
      instanceId,
      userMessage: userText,
      source: "web",
    });

    const { agent, messages } = prepareResult.result;

    const streamId = crypto.randomUUID();
    await setStreamingMessage(instanceId, streamId);

    const result = await agent.stream({
      prompt: messages,
      experimental_transform: smoothStream(),
      abortSignal: request.signal,
    });

    const streamContext = getStreamContext();
    return result.toUIMessageStreamResponse({
      headers: {
        "X-Stream-Id": streamId,
      },
      ...(streamContext
        ? {
            consumeSseStream: ({ stream }) => {
              void streamContext.createNewResumableStream(
                streamId,
                () => stream,
              );
            },
          }
        : {}),
    });
  } catch (error: unknown) {
    // Surface AI quota / rate-limit errors from the provider
    if (error && typeof error === "object" && "statusCode" in error) {
      const aiError = error as { statusCode: number; message?: string };
      if (aiError.statusCode === 429) {
        return new Response(
          JSON.stringify({
            error: "ai_quota_exceeded",
            message:
              "AI model quota exceeded. Please wait a moment and try again, or switch to a different model in Settings.",
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    // Re-surface TRPCErrors (auth, not found)
    if (error instanceof TRPCError) {
      const statusMap: Record<string, number> = {
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
      };
      return new Response(error.message, {
        status: statusMap[error.code] ?? 500,
      });
    }

    console.error("[chat/POST] Unhandled error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET(request: Request) {
  try {
    const authResult = await getAuthenticatedInstance(request);
    const { instanceId } = authResult;

    const url = new URL(request.url);
    const streamId = url.searchParams.get("streamId");

    if (!streamId) {
      return new Response("Missing streamId", { status: 400 });
    }

    const activeStreamId = await getStreamingMessage(instanceId);
    if (activeStreamId !== streamId) {
      return new Response("Stream not found or not yours", { status: 404 });
    }

    const streamContext = getStreamContext();
    if (!streamContext) {
      // 404 instead of 204 — 204 No Content causes a Response constructor crash in Next.js
      return new Response("Stream resumption not available", { status: 404 });
    }

    const stream = await streamContext.resumeExistingStream(streamId);
    if (!stream) {
      // 404 instead of 204 — 204 No Content causes a Response constructor crash in Next.js
      return new Response("Stream already completed", { status: 404 });
    }

    return new Response(stream.pipeThrough(new TextEncoderStream()), {
      headers: UI_MESSAGE_STREAM_HEADERS,
    });
  } catch (error: unknown) {
    if (error instanceof TRPCError) {
      const statusMap: Record<string, number> = {
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
      };
      return new Response(error.message, {
        status: statusMap[error.code] ?? 500,
      });
    }

    console.error("[chat/GET] Unhandled error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
