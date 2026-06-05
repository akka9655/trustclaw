import { NextResponse } from "next/server";
import { db } from "~/server/clients/db";
import { prepareAgentRun } from "~/server/api/routers/trustclaw/agent/setup";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return new Response("Missing webhook token", { status: 400 });
  }

  const instance = await db.composioClawInstance.findUnique({
    where: { webhookToken: token },
    select: { id: true, userId: true },
  });

  if (!instance) {
    return new Response("Invalid webhook token", { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const userMessage = `[Webhook Event Triggered]\n\nPayload: ${
    body ? JSON.stringify(body, null, 2) : "Empty payload"
  }`;

  const prepareResult = await prepareAgentRun({
    instanceId: instance.id,
    userMessage,
    source: "cron", // runs in background
  });

  const { agent, messages } = prepareResult.result;

  const result = await agent.generate({
    prompt: messages,
  });

  // Assemble full text response
  const responseText = result.steps
    .map((s: { text?: string }) => s.text)
    .filter(Boolean)
    .join("\n");

  return NextResponse.json({
    success: true,
    response: responseText || "Processed successfully without textual response",
  });
}
