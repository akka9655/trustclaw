"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { trpc } from "~/clients/trpc";
import { toast } from "sonner";

export function useChatHook({ initialMessages, streamId }: {
  initialMessages: UIMessage[];
  streamId: string | null;
}) {
  const utils = trpc.useUtils();
  const seededRef = useRef(false);
  const [isSeeded, setIsSeeded] = useState(false);

  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: "/api/chat",
      prepareReconnectToStreamRequest: () => {
        return { api: `/api/chat?streamId=${streamId}` };
      },
    });
  }, [streamId]);

  const chat = useChat({
    id: "chat",
    transport,
    resume: streamId !== null,
    onFinish: () => {
      void utils.trustclaw.getHistory.invalidate();
    },
    onError: (error) => {
      void utils.trustclaw.getHistory.invalidate();

      const rawMessage = error instanceof Error ? error.message : String(error);

      // Silently ignore expected stream-reconnect non-errors — these happen
      // normally when the page loads with a stale/completed streamId in Redis.
      const isStreamNonError =
        rawMessage.includes("Stream not found") ||
        rawMessage.includes("Stream already completed") ||
        rawMessage.includes("Stream resumption not available") ||
        rawMessage.includes("nothing to resume");
      if (isStreamNonError) return;

      // Show user-friendly toast for real errors
      let message = "Something went wrong. Please try again.";

      if (rawMessage.includes("quota") || rawMessage.includes("rate_limit") || rawMessage.includes("429")) {
        message = "⚠️ AI quota exceeded — switch to a GitHub Model in Settings, or wait and retry.";
      } else if (rawMessage.includes("GITHUB_MODELS_API_KEY") || rawMessage.includes("API key is missing")) {
        message = "⚠️ GitHub Models API key is not configured. Go to Settings → Model to set it up.";
      } else if (rawMessage.includes("401") || rawMessage.includes("Unauthorized")) {
        message = "⚠️ Session expired. Please refresh the page.";
      } else if (rawMessage.trim()) {
        message = rawMessage;
      }

      toast.error(message, { duration: 8000 });
    },
  });

  // Seed initial messages once on mount. Never pass `messages` as a controlled
  // prop to useChat - it resets internal state on every render, which causes a
  // scroll loop when combined with Virtuoso's followOutput during streaming.
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    if (initialMessages.length > 0) {
      chat.setMessages(initialMessages);
    }
    setIsSeeded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once on mount only
  }, []);

  const sendMessageRef = useRef(chat.sendMessage);
  sendMessageRef.current = chat.sendMessage;

  const sendMessage = useCallback((text: string) => {
    void sendMessageRef.current({ text });
  }, []);

  const stopRef = useRef(chat.stop);
  stopRef.current = chat.stop;

  const stableStop = useCallback(() => {
    void stopRef.current();
  }, []);

  return {
    sendMessage,
    stop: stableStop,
    // Return initialMessages until seeded to avoid flash of empty state
    messages: isSeeded ? chat.messages : initialMessages,
    status: chat.status,
    error: chat.error,
    setMessages: chat.setMessages,
  };
}
