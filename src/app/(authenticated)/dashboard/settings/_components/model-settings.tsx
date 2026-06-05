"use client";

import { Brain, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

export function ModelSettings({ currentModel: _currentModel }: { currentModel: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          AI Model
          <Badge variant="secondary" className="text-xs font-normal">
            <Zap className="mr-1 h-3 w-3" />
            Free
          </Badge>
        </CardTitle>
        <CardDescription>
          Basi-jarvis is powered by Google Gemini — no API cost
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <Brain className="h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">Gemini 2.5 Flash</p>
            <p className="text-xs text-muted-foreground">
              1M token context · Fast · Free via Google AI Studio
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Want a different model? Use the <strong>Custom API Provider</strong> section below to connect any OpenAI-compatible endpoint.
        </p>
      </CardContent>
    </Card>
  );
}
