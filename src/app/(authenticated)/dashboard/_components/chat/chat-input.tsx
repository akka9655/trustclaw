"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, Square, Mic, MicOff, Paperclip, X, FileText, Sparkles } from "lucide-react";
import type { ChatStatus } from "ai";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import { showSuccessToast } from "~/components/core/toast-notifications";

import { useSearchParams } from "next/navigation";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  status: ChatStatus;
}

const MAX_MESSAGE_LENGTH = 50_000;
const WARN_LENGTH = 40_000;

const QUICK_ACTIONS = [
  { label: "📉 Daily Crypto Briefing", prompt: "Set up a daily cron job at 8 AM to fetch the latest Bitcoin price, crypto trends, and trading news, and send me a morning briefing via Telegram." },
  { label: "📓 Trading & Idea Journal", prompt: "Connect to Notion or Google Sheets via Composio and create a 'Trading & Business Journal'. Log this idea: [Type your trade or business idea here]" },
  { label: "💻 Find OS Issues", prompt: "Search GitHub using Composio for 3 'good first issue' tasks related to React, software, or electronics, and summarize them for me so I can start contributing." },
  { label: "🗓️ Workout Scheduler", prompt: "Connect to my Google Calendar via Composio, look at my schedule for this week, and automatically block out 1-hour slots for my fat loss gym workouts." },
  { label: "📰 Weekly Tech Digest", prompt: "Set up a weekly cron job every Friday evening to search for the top posts from HackerNews (software and tech) and send me a digest summary." },
  { label: "🍗 Log Meal", prompt: "Here is what I ate: [Type food]. Analyze it for fat loss, calculate the protein/calories, and log it to my Basith Fat Loss Tracker sheet." },
];

export function ChatInput({ onSend, onStop, status }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; content: string }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const prompt = searchParams.get("prompt");
    if (prompt) {
      setInput(prompt);
      // Clean up the URL parameter
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("prompt");
      const cleanPath = `${window.location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ""}`;
      window.history.replaceState(null, "", cleanPath);
    }
  }, [searchParams]);

  const isStreaming = status === "streaming" || status === "submitted";
  const isTooLong = input.length > MAX_MESSAGE_LENGTH;
  const isNearLimit = input.length > WARN_LENGTH && !isTooLong;
  const canSend = (input.trim().length > 0 || attachedFiles.length > 0) && !isStreaming && !isTooLong;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Auto-focus textarea when streaming stops
  useEffect(() => {
    if (!isStreaming && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isStreaming]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
        };

        rec.onerror = () => {
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      showSuccessToast("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      // Allow files under 10MB
      if (file.size > 10 * 1024 * 1024) {
        showSuccessToast(`File ${file.name} is too large (max 10MB)`);
        return;
      }

      const reader = new FileReader();

      if (file.type.startsWith("image/")) {
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setAttachedFiles((prev) => [
            ...prev,
            { name: file.name, content: `[Attached Image: ${file.name}]\nData URI: ${base64}` },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (event) => {
          const text = event.target?.result as string;
          setAttachedFiles((prev) => [
            ...prev,
            { name: file.name, content: `[Attached File: ${file.name}]\n---\n${text}\n---` },
          ]);
        };
        reader.readAsText(file);
      }
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = useCallback(() => {
    if (!canSend) return;

    let finalPrompt = input.trim();
    if (attachedFiles.length > 0) {
      const attachmentsText = attachedFiles.map((f) => f.content).join("\n\n");
      finalPrompt = `${attachmentsText}\n\n${finalPrompt}`;
    }

    onSend(finalPrompt);
    setInput("");
    setAttachedFiles([]);
  }, [canSend, input, attachedFiles, onSend]);

  const handleStop = useCallback(() => {
    onStop();
  }, [onStop]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming) return;
      handleSubmit();
    }
  };

  return (
    <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-2xl space-y-2 p-2 pb-safe sm:p-3 md:p-4">
        {/* Quick Actions Scroll Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none snap-x mask-gradient-right">
          {QUICK_ACTIONS.map((act) => (
            <button
              key={act.label}
              disabled={isStreaming}
              onClick={() => {
                onSend(act.prompt);
              }}
              className="flex items-center gap-1.5 shrink-0 snap-start rounded-xl border border-primary/10 bg-primary/5 hover:bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer backdrop-blur-md hover:-translate-y-0.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {act.label}
            </button>
          ))}
        </div>

        {/* Attachment Previews */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {attachedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground border border-border"
              >
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(idx)}
                  className="hover:text-foreground ml-1 p-0.5 rounded-full hover:bg-muted-foreground/10"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div
          className={cn(
            "flex items-end gap-2 rounded-2xl border px-3 py-2 transition-all duration-300 shadow-sm",
            "bg-muted/20 border-border/60",
            "focus-within:border-primary/40 focus-within:bg-background focus-within:shadow-md focus-within:shadow-primary/5",
          )}
        >
          {/* File attachment trigger */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming}
            className="size-8 rounded-xl shrink-0 text-muted-foreground/60 hover:text-foreground"
            title="Attach documents or images"
          >
            <Paperclip className="size-4" />
          </Button>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isStreaming ? "Waiting for response..." : "Ask Basi-jarvis anything..."
            }
            disabled={isStreaming}
            rows={1}
            className={cn(
              "border-0 bg-transparent p-0 shadow-none",
              "max-h-[160px] min-h-[36px] resize-none",
              "text-base md:text-sm",
              "placeholder:text-muted-foreground/50",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
            )}
          />

          <div className="flex shrink-0 items-center gap-1.5 pb-0.5">
            {/* Voice Mic Trigger */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleListening}
              disabled={isStreaming}
              className={cn(
                "size-8 rounded-xl shrink-0 transition-colors",
                isListening
                  ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  : "text-muted-foreground/60 hover:text-foreground",
              )}
              title={isListening ? "Listening..." : "Voice input"}
            >
              {isListening ? <MicOff className="size-4 animate-pulse" /> : <Mic className="size-4" />}
            </Button>

            {isStreaming ? (
              <Button
                variant="default"
                size="icon"
                className="size-8 rounded-xl"
                onClick={handleStop}
                title="Stop generating"
              >
                <Square className="size-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                variant="default"
                size="icon"
                className={cn(
                  "size-8 rounded-xl transition-all",
                  canSend ? "opacity-100 scale-100" : "opacity-40 scale-95",
                )}
                onClick={handleSubmit}
                disabled={!canSend}
                title="Send message (Enter)"
              >
                <ArrowUp className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-1.5 flex items-center justify-between px-1">
          <p className="text-muted-foreground/60 text-xs hidden sm:block">
            {isStreaming ? "Generating..." : "Enter to send · Shift+Enter for new line"}
          </p>
          {(isNearLimit || isTooLong) && (
            <p
              className={cn(
                "text-xs ml-auto",
                isTooLong ? "text-destructive" : "text-yellow-500",
              )}
            >
              {input.length.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
