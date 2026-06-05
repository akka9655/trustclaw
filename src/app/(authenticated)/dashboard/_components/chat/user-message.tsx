"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import type { UIMessage } from "@ai-sdk/react";

interface UserMessageProps {
  message: UIMessage;
}

export function UserMessage({ message }: UserMessageProps) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const textContent = message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");

  const handleCopy = () => {
    void navigator.clipboard.writeText(textContent);
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-end">
      <div className="relative max-w-[85%] sm:max-w-[80%]">
        <div className="rounded-2xl rounded-br-md bg-gradient-to-br from-primary/90 to-primary px-3.5 py-2.5 text-sm text-primary-foreground shadow-sm shadow-primary/10">
          <p className="whitespace-pre-wrap leading-relaxed">{textContent}</p>
        </div>
      </div>

      <button
        onClick={handleCopy}
        aria-label="Copy message"
        className="mt-1 mr-0.5 flex h-6 w-6 items-center justify-center text-muted-foreground/50 transition-colors hover:text-muted-foreground"
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
    </div>
  );
}
