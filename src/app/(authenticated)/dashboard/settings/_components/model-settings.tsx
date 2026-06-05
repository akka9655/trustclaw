"use client";

import { useState } from "react";
import { Brain, Zap, Loader2, Check, Github, Sparkles } from "lucide-react";
import { trpc } from "~/clients/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { showSuccessToast, trpcToastOnError } from "~/components/core/toast-notifications";
import { cn } from "~/lib/utils";

const MODELS_CONFIG = [
  {
    value: "gemini-2.5-flash",
    label: "Google Gemini 2.5 Flash",
    description: "Extremely fast, excellent tool execution, and completely free.",
    tokenConsumption: "Low Token Consumption",
    tokenColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    isDefault: true,
    provider: "google",
  },
  {
    value: "github-gpt-4o-mini",
    label: "GPT-4o-mini (GitHub)",
    description: "Highly optimized lightweight model. Exceptional speed and logic.",
    tokenConsumption: "Low Token Consumption",
    tokenColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    isDefault: false,
    provider: "github",
  },
  {
    value: "github-gpt-4o",
    label: "GPT-4o (GitHub)",
    description: "Advanced reasoning model for complex tasks and deep planning.",
    tokenConsumption: "High Token Consumption",
    tokenColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    isDefault: false,
    provider: "github",
  },
  {
    value: "github-llama-3.3-70b-instruct",
    label: "Llama 3.3 70B (GitHub)",
    description: "High-quality open weights model. Excellent for general coding and logic.",
    tokenConsumption: "Medium-High Token Consumption",
    tokenColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    isDefault: false,
    provider: "github",
  },
  {
    value: "github-cohere-command-r-plus",
    label: "Cohere Command R+ (GitHub)",
    description: "Specifically tuned for complex agentic workflows and tool invocation.",
    tokenConsumption: "Medium Token Consumption",
    tokenColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    isDefault: false,
    provider: "github",
  },
] as const;

interface ModelSettingsProps {
  currentModel: string;
}

export function ModelSettings({ currentModel }: ModelSettingsProps) {
  const utils = trpc.useUtils();
  const [selectedModel, setSelectedModel] = useState<string>(currentModel || "gemini-2.5-flash");
  const [saved, setSaved] = useState(false);

  const updateSettings = trpc.trustclaw.updateSettings.useMutation({
    onSuccess: () => {
      showSuccessToast("AI model settings updated");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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
  const isSelectedModelGithub = selectedModel.startsWith("github-");

  return (
    <Card className="border border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span>AI Model Selection</span>
          </div>
          {currentModel === "gemini-2.5-flash" || !currentModel ? (
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-normal">
              Gemini Connected
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs font-normal">
              GitHub Models Active
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Select the model that powers Basi-jarvis's brain and tool execution.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MODELS_CONFIG.map((model) => {
            const isSelected = selectedModel === model.value;
            const Icon = model.provider === "github" ? Github : Sparkles;

            return (
              <button
                key={model.value}
                type="button"
                onClick={() => setSelectedModel(model.value)}
                className={cn(
                  "relative flex min-h-[44px] flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all duration-200 hover:bg-muted/50 cursor-pointer",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                    : "border-border"
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-sm font-semibold">{model.label}</span>
                  </div>
                  {model.isDefault && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 text-[10px] py-0 px-1.5 font-medium shrink-0">
                      Default - Connected
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {model.description}
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium border", model.tokenColor)}>
                    {model.tokenConsumption}
                  </span>
                </div>

                {isSelected && (
                  <div className="absolute right-3 bottom-3 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {isSelectedModelGithub && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-blue-600 dark:text-blue-400 space-y-2">
            <p className="font-semibold flex items-center gap-1.5">
              <Github className="h-4 w-4" />
              GitHub Models Setup Required
            </p>
            <p className="leading-relaxed">
              To use GitHub Models, you must add your GitHub Personal Access Token (PAT) with the <code className="font-mono bg-blue-500/10 px-1 rounded">models:read</code> scope to Vercel as an environment variable named <strong className="font-mono">GITHUB_MODELS_API_KEY</strong>.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            disabled={!hasChanges || updateSettings.isPending}
            onClick={handleSave}
            className="w-full sm:w-auto min-h-[44px]"
          >
            {updateSettings.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving brain settings...
              </>
            ) : saved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Brain settings saved!
              </>
            ) : (
              "Save Model Selection"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

