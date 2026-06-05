"use client";

import { useState } from "react";
import { Loader2, Edit3, Check, RotateCcw } from "lucide-react";
import { trpc } from "~/clients/trpc";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { showSuccessToast, trpcToastOnError } from "~/components/core/toast-notifications";

interface PromptSettingsProps {
  currentPrompt: string | null;
}

export function PromptSettings({ currentPrompt }: PromptSettingsProps) {
  const utils = trpc.useUtils();
  const [prompt, setPrompt] = useState(currentPrompt ?? "");
  const [saved, setSaved] = useState(false);

  const updateSettings = trpc.trustclaw.updateSettings.useMutation({
    onSuccess: () => {
      showSuccessToast("System instructions updated");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      void utils.trustclaw.getInstance.invalidate();
    },
    onError: trpcToastOnError,
  });

  const handleSave = () => {
    void updateSettings.mutateAsync({
      userPrompt: prompt,
    });
  };

  const handleReset = () => {
    setPrompt("");
    void updateSettings.mutateAsync({
      userPrompt: "",
    });
  };

  const hasChanges = prompt !== (currentPrompt ?? "");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-primary" />
          Custom System Instructions
        </CardTitle>
        <CardDescription>
          Instruct Basi-jarvis how to behave, speak, or what priorities it should have
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="custom-prompt" className="text-xs font-normal text-muted-foreground">
            Instructions (markdown supported)
          </Label>
          <textarea
            id="custom-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Always respond in bullet points. Focus on email summaries first. Speak in a friendly tone..."
            rows={5}
            maxLength={4000}
            className="w-full min-h-[120px] rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{4000 - prompt.length} characters remaining</span>
            {currentPrompt && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 hover:text-foreground text-destructive"
              >
                <RotateCcw className="h-3 w-3" />
                Reset to default
              </button>
            )}
          </div>
        </div>

        <Button
          disabled={!hasChanges || updateSettings.isPending}
          onClick={handleSave}
          className="w-full sm:w-auto"
        >
          {updateSettings.isPending ? (
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
            "Save Instructions"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
