"use client";

import { Settings } from "lucide-react";
import { trpc } from "~/clients/trpc";
import Link from "next/link";
import { ErrorDisplay } from "~/components/core/error-display";
import { ErrorBoundary } from "~/components/core/error-boundary";
import { ModelSettings } from "./model-settings";
import { CustomApiSettings } from "./custom-api-settings";
import { PromptSettings } from "./prompt-settings";
import { WebhookSettings } from "./webhook-settings";
import { UsageStats } from "./usage-stats";
import { TelegramSettings } from "./telegram-settings";
import { CronJobsSettings } from "./cron-jobs-settings";
import { MemorySettings } from "./memory-settings";
import { DangerZone } from "./danger-zone";
import { SettingsPageSkeleton } from "./settings-page.skeleton";

export function SettingsPageClient() {
  const { data, isLoading, error } = trpc.trustclaw.getInstance.useQuery();
  const instance = data?.instance ?? null;

  if (isLoading) {
    return <SettingsPageSkeleton />;
  }

  if (error) {
    return (
      <ErrorDisplay
        message={error.message}
        retryText="Try again"
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!instance) {
    return (
      <div className="mx-auto w-full max-w-2xl p-4 md:p-6">
        <div className="text-center">
          <p className="text-muted-foreground">No Basi-jarvis instance found.</p>
          <Link
            href="/dashboard"
            className="text-primary mt-2 inline-block hover:underline"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
    <div className="mx-auto w-full max-w-2xl space-y-4 px-3 py-4 pb-8 sm:px-4 md:space-y-6 md:px-6 md:py-6">
      <div className="flex items-center gap-2 pb-1">
        <Settings className="text-muted-foreground h-5 w-5" />
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">Settings</h1>
          <p className="text-muted-foreground text-xs">Manage your Basi-jarvis preferences</p>
        </div>
      </div>

      <ErrorBoundary>
        <UsageStats />
      </ErrorBoundary>

      <ErrorBoundary>
        <ModelSettings currentModel={instance.anthropicModel} />
      </ErrorBoundary>

      <ErrorBoundary>
        <PromptSettings currentPrompt={instance.userPrompt ?? null} />
      </ErrorBoundary>

      <ErrorBoundary>
        <WebhookSettings currentWebhookToken={instance.webhookToken ?? null} />
      </ErrorBoundary>

      <ErrorBoundary>
        <CustomApiSettings
          currentUrl={instance.customApiUrl ?? null}
          currentKey={instance.customApiKey ?? null}
          currentModel={instance.customApiModel ?? null}
        />
      </ErrorBoundary>

      {data?.telegramConfigured && (
        <ErrorBoundary>
          <TelegramSettings />
        </ErrorBoundary>
      )}

      <ErrorBoundary>
        <CronJobsSettings />
      </ErrorBoundary>

      <ErrorBoundary>
        <MemorySettings />
      </ErrorBoundary>

      <ErrorBoundary>
        <DangerZone />
      </ErrorBoundary>
    </div>
    </div>
  );
}
