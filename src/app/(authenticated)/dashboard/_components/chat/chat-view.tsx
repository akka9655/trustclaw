"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Virtuoso } from "react-virtuoso";
import type { VirtuosoHandle } from "react-virtuoso";
import type { UIMessage } from "@ai-sdk/react";
import { Loader2, ArrowDown, Sparkles } from "lucide-react";
import { ErrorBoundary } from "~/components/core/error-boundary";
import { Button } from "~/components/ui/button";
import { useTerminalStore } from "../terminal-store";
import { useChatHook } from "../use-chat-hook";
import { UserMessage } from "./user-message";
import { AssistantMessage } from "./assistant-message/assistant-message";
import { ThinkingIndicator } from "./assistant-message/thinking-indicator";
import { ChatInput } from "./chat-input";
import { TerminalPane } from "../terminal/terminal-pane";
import { ComposioCta } from "./composio-cta";

const START_INDEX = 100_000;

interface ChatViewProps {
  initialMessages: UIMessage[];
  streamId: string | null;
  historyPageCount: number;
  fetchOlderMessages: () => void;
  hasOlderMessages: boolean;
  isFetchingOlderMessages: boolean;
}

export function ChatView({
  initialMessages,
  streamId,
  historyPageCount,
  fetchOlderMessages,
  hasOlderMessages,
  isFetchingOlderMessages,
}: ChatViewProps) {
  const { sendMessage, stop, messages, status, setMessages } = useChatHook({ initialMessages, streamId });
  const terminalOpen = useTerminalStore((s) => s.terminalOpen);
  const setTerminalOpen = useTerminalStore((s) => s.setTerminalOpen);
  const isEmpty = messages.length === 0;

  const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [atBottom, setAtBottom] = useState(true);

  const prevMessageCountRef = useRef(messages.length);
  const prevFirstIdRef = useRef<string | null>(null);

  if (messages.length > 0) {
    const currentFirstId = messages[0]!.id;
    const countDelta = messages.length - prevMessageCountRef.current;

    if (countDelta > 0 && prevFirstIdRef.current !== null && currentFirstId !== prevFirstIdRef.current) {
      setFirstItemIndex((prev) => prev - countDelta);
    }

    prevMessageCountRef.current = messages.length;
    prevFirstIdRef.current = currentFirstId;
  }

  // Infinite scroll: prepend older messages when new history pages load
  const pageCountRef = useRef(historyPageCount);
  useEffect(() => {
    if (historyPageCount <= pageCountRef.current) {
      pageCountRef.current = historyPageCount;
      return;
    }
    setMessages((current) => {
      const currentIds = new Set(current.map((m) => m.id));
      const newOlder = initialMessages.filter((m) => !currentIds.has(m.id));
      if (newOlder.length === 0) return current;
      return [...newOlder, ...current];
    });
    pageCountRef.current = historyPageCount;
  }, [historyPageCount, initialMessages, setMessages]);

  const handleStartReached = useCallback(() => {
    if (hasOlderMessages && !isFetchingOlderMessages) {
      void fetchOlderMessages();
    }
  }, [hasOlderMessages, isFetchingOlderMessages, fetchOlderMessages]);

  const isStreaming = status === "streaming" || status === "submitted";
  const lastMessage = messages[messages.length - 1];
  const isWaitingForAssistant = isStreaming && lastMessage?.role === "user";

  // Scroll the user's message to the top of the viewport when they send it
  const handleSend = useCallback(
    (text: string) => {
      const result = sendMessage(text);
      // Wait one frame for Virtuoso to render the new user message
      requestAnimationFrame(() => {
        virtuosoRef.current?.scrollToIndex({
          index: "LAST",
          align: "start",
          behavior: "smooth",
        });
      });
      return result;
    },
    [sendMessage],
  );

  const handleScrollToBottom = useCallback(() => {
    virtuosoRef.current?.scrollToIndex({
      index: "LAST",
      align: "end",
      behavior: "smooth",
    });
  }, []);

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col">
        <ComposioCta />
        <div className="relative min-h-0 flex-1">
          {isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 max-w-lg mx-auto text-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/30 via-purple-500/20 to-pink-500/20 blur-xl animate-pulse" />
                <div className="relative size-16 rounded-3xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
                  <Sparkles className="size-8 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                  Hey Basith, what&apos;s up?
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your AI coach, mentor &amp; builder — ready to help with diet, code, trading, or deploying websites.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {["🍗 Log Food", "💻 Build Site", "📈 Learn Trading", "🔍 Find Issues"].map((tag) => (
                  <span key={tag} className="rounded-full bg-muted/60 border border-border/50 px-3 py-1 text-xs text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <Virtuoso
              ref={virtuosoRef}
              data={messages}
              firstItemIndex={firstItemIndex}
              initialTopMostItemIndex={{ index: "LAST", align: "end" }}
              startReached={handleStartReached}
              atBottomStateChange={setAtBottom}
              atBottomThreshold={50}
              increaseViewportBy={{ top: 200, bottom: 0 }}
              components={{
                Header: () =>
                  isFetchingOlderMessages ? (
                    <div className="flex justify-center py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : null,
                Footer: () => (
                  <div className="pb-4 md:pb-6">
                    {isWaitingForAssistant && (
                      <div className="mx-auto w-full max-w-3xl px-4 pt-6 md:px-8">
                        <ThinkingIndicator />
                      </div>
                    )}
                  </div>
                ),
              }}
              itemContent={(_index, message) =>
                message.role === "user" ? (
                  <div className="mx-auto w-full max-w-3xl px-4 pt-4 md:px-8">
                    <ErrorBoundary
                      key={message.id}
                      fallback={
                        <p className="text-muted-foreground text-sm italic">
                          Failed to render message
                        </p>
                      }
                    >
                      <div className="flex items-start justify-end gap-3">
                        <div className="flex-1">
                          <UserMessage message={message} />
                        </div>
                        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                          U
                        </div>
                      </div>
                    </ErrorBoundary>
                  </div>
                ) : (
                  <div className="mx-auto w-full max-w-3xl px-4 pt-4 md:px-8">
                    <ErrorBoundary
                      key={message.id}
                      fallback={
                        <p className="text-muted-foreground text-sm italic">
                          Failed to render message
                        </p>
                      }
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-white shadow-md shadow-primary/15">
                          <Sparkles className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0 bg-card/40 border border-border/50 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
                          <AssistantMessage
                            message={message}
                            status={message.id === lastMessage?.id ? status : "ready"}
                            onOpenTerminal={() => setTerminalOpen(true)}
                          />
                        </div>
                      </div>
                    </ErrorBoundary>
                  </div>
                )
              }
              className="!overflow-y-auto"
            />
          )}

          {!atBottom && !isEmpty && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleScrollToBottom}
              className="absolute bottom-4 left-1/2 size-10 -translate-x-1/2 rounded-full shadow-md"
            >
              <ArrowDown className="size-4" />
            </Button>
          )}
        </div>

        <ChatInput onSend={handleSend} onStop={stop} status={status} />
      </div>

      {terminalOpen && (
        <div className="hidden w-[400px] shrink-0 border-l border-border md:block lg:w-[500px]">
          <TerminalPane messages={messages} status={status} onHide={() => setTerminalOpen(false)} />
        </div>
      )}
    </div>
  );
}
