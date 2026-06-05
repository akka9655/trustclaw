"use client";

import { useState } from "react";
import { Brain, Zap, Loader2, Check, Github, Sparkles, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { trpc } from "~/clients/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { showSuccessToast, trpcToastOnError } from "~/components/core/toast-notifications";
import { cn } from "~/lib/utils";

// GitHub Models free-tier limits (as of 2026)
// Low-tier models:  15 req/min · 150 req/day  · resets midnight UTC
// High-tier models: 10 req/min ·  50 req/day  · resets midnight UTC

const MODELS_CONFIG = [
  {
    value: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "Google",
    providerType: "google" as const,
    description: "Default model. Fastest free tier with 1M token context. Best for daily long-term use.",
    tokenLoad: "Low" as const,
    isDefault: true,
    limitPerMin: null,
    limitPerDay: null,
    resets: "No limit — Free via Google AI Studio",
    bestFor: "Daily use · Long context · Speed",
    tag: "FREE · No Reset",
    tagColor: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
  },
  {
    value: "github-gpt-4.1-nano",
    label: "GPT-4.1 Nano",
    provider: "OpenAI via GitHub",
    providerType: "github" as const,
    description: "Fastest OpenAI model. Lowest latency & cost — great for high-frequency calls.",
    tokenLoad: "Low" as const,
    isDefault: false,
    limitPerMin: 15,
    limitPerDay: 150,
    resets: "Resets daily at midnight UTC",
    bestFor: "Speed · High frequency · Low cost",
    tag: "150 req/day",
    tagColor: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
  },
  {
    value: "github-gpt-4.1-mini",
    label: "GPT-4.1 Mini",
    provider: "OpenAI via GitHub",
    providerType: "github" as const,
    description: "Outperforms GPT-4o-mini on coding & instruction following. Good balance.",
    tokenLoad: "Low" as const,
    isDefault: false,
    limitPerMin: 15,
    limitPerDay: 150,
    resets: "Resets daily at midnight UTC",
    bestFor: "Coding · Instructions · Balance",
    tag: "150 req/day",
    tagColor: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
  },
  {
    value: "github-gpt-4o-mini",
    label: "GPT-4o Mini",
    provider: "OpenAI via GitHub",
    providerType: "github" as const,
    description: "Affordable, efficient for diverse text tasks. Very stable for agentic workflows.",
    tokenLoad: "Low" as const,
    isDefault: false,
    limitPerMin: 15,
    limitPerDay: 150,
    resets: "Resets daily at midnight UTC",
    bestFor: "Agentic tasks · Text · Stability",
    tag: "150 req/day",
    tagColor: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
  },
  {
    value: "github-gpt-4o",
    label: "GPT-4o",
    provider: "OpenAI via GitHub",
    providerType: "github" as const,
    description: "Most advanced multimodal model. Handles text + images. Suited for complex tasks.",
    tokenLoad: "High" as const,
    isDefault: false,
    limitPerMin: 10,
    limitPerDay: 50,
    resets: "Resets daily at midnight UTC",
    bestFor: "Complex reasoning · Multimodal",
    tag: "50 req/day",
    tagColor: "text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400",
  },
  {
    value: "github-o4-mini",
    label: "OpenAI o4-mini",
    provider: "OpenAI via GitHub",
    providerType: "github" as const,
    description: "Efficient reasoning model. Major improvements in quality and safety over o3-mini.",
    tokenLoad: "Medium" as const,
    isDefault: false,
    limitPerMin: 10,
    limitPerDay: 50,
    resets: "Resets daily at midnight UTC",
    bestFor: "Math · Reasoning · Safety",
    tag: "50 req/day",
    tagColor: "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400",
  },
  {
    value: "github-llama-3.1-8b-instruct",
    label: "Llama 3.1 8B Instruct",
    provider: "Meta via GitHub",
    providerType: "github" as const,
    description: "Compact and fast open-weights model. Best for high-volume, low-latency use cases.",
    tokenLoad: "Low" as const,
    isDefault: false,
    limitPerMin: 15,
    limitPerDay: 150,
    resets: "Resets daily at midnight UTC",
    bestFor: "High volume · Low latency · Multilingual",
    tag: "150 req/day",
    tagColor: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
  },
  {
    value: "github-llama-3.3-70b-instruct",
    label: "Llama 3.3 70B Instruct",
    provider: "Meta via GitHub",
    providerType: "github" as const,
    description: "Performance comparable to Llama 3.1 405B. Excellent reasoning and coding.",
    tokenLoad: "Medium" as const,
    isDefault: false,
    limitPerMin: 10,
    limitPerDay: 50,
    resets: "Resets daily at midnight UTC",
    bestFor: "Reasoning · Coding · Instruction",
    tag: "50 req/day",
    tagColor: "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400",
  },
  {
    value: "github-phi-4-mini-instruct",
    label: "Phi-4 Mini Instruct",
    provider: "Microsoft via GitHub",
    providerType: "github" as const,
    description: "3.8B SLM. Outperforms larger models on math & function-calling. 4GB RAM friendly.",
    tokenLoad: "Low" as const,
    isDefault: false,
    limitPerMin: 15,
    limitPerDay: 150,
    resets: "Resets daily at midnight UTC",
    bestFor: "Math · Function calls · Low-RAM",
    tag: "150 req/day",
    tagColor: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
  },
  {
    value: "github-phi-4",
    label: "Phi-4",
    provider: "Microsoft via GitHub",
    providerType: "github" as const,
    description: "14B model. Highly capable for low-latency scenarios. Strong at reasoning.",
    tokenLoad: "Medium" as const,
    isDefault: false,
    limitPerMin: 10,
    limitPerDay: 50,
    resets: "Resets daily at midnight UTC",
    bestFor: "Low latency · Reasoning · Code",
    tag: "50 req/day",
    tagColor: "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400",
  },
  {
    value: "github-deepseek-v3",
    label: "DeepSeek-V3",
    provider: "DeepSeek via GitHub",
    providerType: "github" as const,
    description: "Enhanced reasoning, function calling & code gen. Major upgrade over previous V3.",
    tokenLoad: "Medium" as const,
    isDefault: false,
    limitPerMin: 10,
    limitPerDay: 50,
    resets: "Resets daily at midnight UTC",
    bestFor: "Code generation · Function calls",
    tag: "50 req/day",
    tagColor: "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400",
  },
  {
    value: "github-deepseek-r1",
    label: "DeepSeek-R1",
    provider: "DeepSeek via GitHub",
    providerType: "github" as const,
    description: "Step-by-step reasoning specialist. Excels at science, math, and complex logic.",
    tokenLoad: "High" as const,
    isDefault: false,
    limitPerMin: 10,
    limitPerDay: 50,
    resets: "Resets daily at midnight UTC",
    bestFor: "Deep reasoning · Math · Science",
    tag: "50 req/day",
    tagColor: "text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400",
  },
  {
    value: "github-mistral-small",
    label: "Mistral Small 3.1",
    provider: "Mistral AI via GitHub",
    providerType: "github" as const,
    description: "Multimodal with 128K context. Lightweight, fast, and highly capable.",
    tokenLoad: "Low" as const,
    isDefault: false,
    limitPerMin: 15,
    limitPerDay: 150,
    resets: "Resets daily at midnight UTC",
    bestFor: "Multimodal · Long context · Speed",
    tag: "150 req/day",
    tagColor: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
  },
  {
    value: "github-grok-3-mini",
    label: "Grok 3 Mini",
    provider: "xAI via GitHub",
    providerType: "github" as const,
    description: "Lightweight reasoning model from xAI. Thinks before responding. Great for logic.",
    tokenLoad: "Low" as const,
    isDefault: false,
    limitPerMin: 15,
    limitPerDay: 150,
    resets: "Resets daily at midnight UTC",
    bestFor: "Logic · Math · Lightweight reasoning",
    tag: "150 req/day",
    tagColor: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
  },
] as const;

type ModelValue = typeof MODELS_CONFIG[number]["value"];

const TOKEN_LOAD_COLOR = {
  Low:    "text-emerald-600 dark:text-emerald-400",
  Medium: "text-amber-600 dark:text-amber-400",
  High:   "text-rose-600 dark:text-rose-400",
};

interface ModelSettingsProps {
  currentModel: string;
}

export function ModelSettings({ currentModel }: ModelSettingsProps) {
  const utils = trpc.useUtils();
  const [selectedModel, setSelectedModel] = useState<string>(currentModel || "gemini-2.5-flash");
  const [saved, setSaved] = useState(false);

  const updateSettings = trpc.trustclaw.updateSettings.useMutation({
    onSuccess: () => {
      showSuccessToast("AI model updated successfully");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      void utils.trustclaw.getInstance.invalidate();
    },
    onError: trpcToastOnError,
  });

  const handleSave = () => {
    void updateSettings.mutateAsync({
      anthropicModel: selectedModel as any,
    });
  };

  const hasChanges = selectedModel !== (currentModel || "gemini-2.5-flash");
  const selectedConfig = MODELS_CONFIG.find((m) => m.value === selectedModel);
  const isGithubModel = selectedModel.startsWith("github-");

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span>AI Model Selection</span>
          </div>
          <div className="flex items-center gap-1.5">
            {!isGithubModel ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                <Sparkles className="mr-1 h-3 w-3" />
                Gemini — Connected
              </Badge>
            ) : (
              <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-medium">
                <Github className="mr-1 h-3 w-3" />
                GitHub Models Active
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Choose which AI model powers Basi-jarvis. All GitHub Models are free with daily limits that reset at midnight UTC.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Model grid */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {MODELS_CONFIG.map((model) => {
            const isSelected = selectedModel === model.value;
            const Icon = model.providerType === "github" ? Github : Sparkles;

            return (
              <button
                key={model.value}
                type="button"
                onClick={() => setSelectedModel(model.value)}
                className={cn(
                  "relative flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all duration-200 cursor-pointer",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                )}
              >
                {/* Header row */}
                <div className="flex w-full items-start justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-sm font-semibold leading-tight truncate">{model.label}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {model.isDefault && (
                      <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] py-0 px-1.5 font-semibold">
                        Default
                      </Badge>
                    )}
                    {isSelected && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Provider */}
                <p className="text-[11px] text-muted-foreground/70 -mt-1">{model.provider}</p>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {model.description}
                </p>

                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-1.5 w-full">
                  {/* Token load */}
                  <span className={cn("text-[10px] font-medium", TOKEN_LOAD_COLOR[model.tokenLoad])}>
                    ● {model.tokenLoad} token load
                  </span>

                  {/* Rate limit tag */}
                  <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold", model.tagColor)}>
                    {model.tag}
                  </span>
                </div>

                {/* Rate limit detail */}
                {model.limitPerDay !== null && (
                  <div className="flex w-full items-center gap-2 text-[10px] text-muted-foreground/70 border-t border-border/50 pt-2 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Zap className="h-2.5 w-2.5" />
                      {model.limitPerMin} req/min
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {model.limitPerDay} req/day
                    </span>
                    <span className="flex items-center gap-1 ml-auto">
                      <RefreshCw className="h-2.5 w-2.5" />
                      Midnight UTC
                    </span>
                  </div>
                )}
                {model.limitPerDay === null && (
                  <div className="flex w-full items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 border-t border-border/50 pt-2 mt-0.5">
                    <Sparkles className="h-2.5 w-2.5" />
                    Unlimited · Free via Google AI Studio
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* GitHub Models info banner */}
        {isGithubModel && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Github className="h-3.5 w-3.5" />
              GitHub Models — Setup Required
            </p>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 leading-relaxed">
              Add a GitHub Personal Access Token (PAT) with the{" "}
              <code className="font-mono bg-blue-500/10 px-1 rounded text-[11px]">models:read</code> scope to Vercel as{" "}
              <strong className="font-mono">GITHUB_MODELS_API_KEY</strong>.{" "}
              Limits reset daily at midnight UTC. See the step-by-step guide below.
            </p>
            {selectedConfig && (
              <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-blue-600/70 dark:text-blue-400/70">
                <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{selectedConfig.limitPerMin} requests/minute</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{selectedConfig.limitPerDay} requests/day</span>
                <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3" />Resets at midnight UTC</span>
              </div>
            )}
          </div>
        )}

        {/* Save button */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground">
            {hasChanges ? "You have unsaved changes." : "Model is up to date."}
          </p>
          <Button
            type="button"
            disabled={!hasChanges || updateSettings.isPending}
            onClick={handleSave}
            className="w-full sm:w-auto min-h-[44px]"
          >
            {updateSettings.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
            ) : saved ? (
              <><Check className="mr-2 h-4 w-4" />Saved!</>
            ) : (
              "Save Model Selection"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
