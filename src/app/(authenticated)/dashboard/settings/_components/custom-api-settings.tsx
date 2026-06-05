"use client";

import { useState } from "react";
import { Loader2, Link2, KeyRound, Bot, Trash2, ExternalLink, Check } from "lucide-react";
import { trpc } from "~/clients/trpc";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { AlertDialog } from "~/components/core/confirm-dialog";
import {
  showSuccessToast,
  trpcToastOnError,
} from "~/components/core/toast-notifications";

const PROVIDER_PRESETS = [
  { label: "OpenAI", url: "https://api.openai.com/v1", model: "gpt-4o" },
  { label: "Groq", url: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
  { label: "OpenRouter", url: "https://openrouter.ai/api/v1", model: "meta-llama/llama-4-maverick:free" },
  { label: "Together AI", url: "https://api.together.xyz/v1", model: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
  { label: "Fireworks", url: "https://api.fireworks.ai/inference/v1", model: "accounts/fireworks/models/llama-v3p3-70b-instruct" },
] as const;

interface CustomApiSettingsProps {
  currentUrl: string | null;
  currentKey: string | null;
  currentModel: string | null;
}

export function CustomApiSettings({
  currentUrl,
  currentKey,
  currentModel,
}: CustomApiSettingsProps) {
  const utils = trpc.useUtils();

  const [url, setUrl] = useState(currentUrl ?? "");
  const [apiKey, setApiKey] = useState(currentKey ?? "");
  const [model, setModel] = useState(currentModel ?? "");
  const [saved, setSaved] = useState(false);

  const isActive = !!currentUrl;
  const canSave = url.trim() !== "" && apiKey.trim() !== "" && model.trim() !== "";

  const updateCustomApi = trpc.trustclaw.updateCustomApi.useMutation({
    onSuccess: () => {
      showSuccessToast("Custom API saved");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      void utils.trustclaw.getInstance.invalidate();
    },
    onError: trpcToastOnError,
  });

  const clearCustomApi = trpc.trustclaw.updateCustomApi.useMutation({
    onSuccess: () => {
      showSuccessToast("Custom API removed");
      setUrl("");
      setApiKey("");
      setModel("");
      void utils.trustclaw.getInstance.invalidate();
    },
    onError: trpcToastOnError,
  });

  const handlePreset = (preset: (typeof PROVIDER_PRESETS)[number]) => {
    setUrl(preset.url);
    setModel(preset.model);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="flex flex-wrap items-center gap-2">
              Custom API Provider
              {isActive && (
                <Badge variant="secondary" className="text-xs font-normal">
                  <Check className="mr-1 h-3 w-3" />
                  Active
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              Use any OpenAI-compatible API — Groq, OpenRouter, Together AI, Fireworks, and more
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Provider quick presets */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Quick presets</Label>
          <div className="flex flex-wrap gap-1.5">
            {PROVIDER_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePreset(preset)}
                className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted hover:text-foreground"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="custom-api-url" className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              Base URL
            </Label>
            <Input
              id="custom-api-url"
              type="url"
              placeholder="https://api.openai.com/v1"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="custom-api-key" className="flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" />
              API Key
            </Label>
            <Input
              id="custom-api-key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Stored on your server — never sent to the browser
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="custom-api-model" className="flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5" />
              Model Name
            </Label>
            <Input
              id="custom-api-model"
              type="text"
              placeholder="gpt-4o"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            disabled={!canSave || updateCustomApi.isPending}
            onClick={() =>
              void updateCustomApi.mutateAsync({
                customApiUrl: url,
                customApiKey: apiKey,
                customApiModel: model,
              })
            }
            className="w-full sm:w-auto"
          >
            {updateCustomApi.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Saved!
              </>
            ) : (
              "Save API Config"
            )}
          </Button>

          {isActive && (
            <AlertDialog
              trigger={
                <Button
                  variant="ghost"
                  className="w-full text-destructive hover:text-destructive sm:w-auto"
                  disabled={clearCustomApi.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Custom API
                </Button>
              }
              title="Remove Custom API"
              description="Your agent will fall back to the default model configuration."
              confirmLabel="Remove"
              onConfirm={() => void clearCustomApi.mutateAsync({ clear: true })}
              isPending={clearCustomApi.isPending}
            />
          )}

          <a
            href="https://openrouter.ai/models?max_price=0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground sm:ml-auto"
          >
            Browse free models on OpenRouter
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
