"use client";

import { useState, useEffect } from "react";
import { Loader2, Link2, Copy, Check, RotateCw, Globe } from "lucide-react";
import { trpc } from "~/clients/trpc";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { showSuccessToast, trpcToastOnError } from "~/components/core/toast-notifications";

interface WebhookSettingsProps {
  currentWebhookToken: string | null;
}

export function WebhookSettings({ currentWebhookToken }: WebhookSettingsProps) {
  const utils = trpc.useUtils();
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const generateToken = trpc.trustclaw.generateWebhookToken.useMutation({
    onSuccess: () => {
      showSuccessToast("Webhook token generated");
      void utils.trustclaw.getInstance.invalidate();
    },
    onError: trpcToastOnError,
  });

  const webhookUrl = currentWebhookToken
    ? `${origin}/api/webhook/basi-jarvis?token=${currentWebhookToken}`
    : "";

  const handleCopy = () => {
    if (!webhookUrl) return;
    void navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              Webhook Trigger
              {currentWebhookToken && (
                <Badge variant="secondary" className="text-xs font-normal">
                  Active
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              Trigger Basi-jarvis from external systems (GitHub, Stripe, custom alerts) by sending a POST request
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentWebhookToken ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
                Your Webhook URL
              </Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={webhookUrl}
                  className="font-mono text-xs select-all bg-muted/30"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                  aria-label="Copy webhook URL"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Send a JSON payload via POST to this URL. Basi-jarvis will parse it and execute tools or save memories accordingly.
            </p>

            <Button
              variant="outline"
              size="sm"
              disabled={generateToken.isPending}
              onClick={() => void generateToken.mutateAsync()}
              className="text-xs"
            >
              {generateToken.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCw className="mr-1.5 h-3.5 w-3.5" />
              )}
              Rotate Webhook Token
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed rounded-lg border-border bg-muted/10">
            <Link2 className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">No webhook active</p>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              Enable the webhook trigger to allow external tools and systems to trigger Basi-jarvis
            </p>
            <Button
              size="sm"
              disabled={generateToken.isPending}
              onClick={() => void generateToken.mutateAsync()}
            >
              {generateToken.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enable Webhook URL
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
