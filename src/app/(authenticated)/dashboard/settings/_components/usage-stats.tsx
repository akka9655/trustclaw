"use client";

import { BarChart3, Database, MessageSquare, ShieldAlert, Cpu } from "lucide-react";
import { trpc } from "~/clients/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

export function UsageStats() {
  const { data, isLoading } = trpc.trustclaw.getStats.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Stats</CardTitle>
          <CardDescription>Loading metrics...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = data ?? {
    totalMessages: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    dailyMessages: [],
    memoryCount: 0,
    cronJobCount: 0,
  };

  const totalTokens = stats.totalInputTokens + stats.totalOutputTokens;
  const tokenCostFree = "Free Tier (No Cost)";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Usage Statistics
        </CardTitle>
        <CardDescription>
          Monitor your agent&apos;s API utilization and saved context
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs">Total Chats</span>
              <MessageSquare className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold tracking-tight">{stats.totalMessages}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs">Tokens Used</span>
              <Cpu className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold tracking-tight">
              {totalTokens > 1000 ? `${(totalTokens / 1000).toFixed(1)}k` : totalTokens}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs">Memories</span>
              <Database className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold tracking-tight">{stats.memoryCount}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs">Active Crons</span>
              <ShieldAlert className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold tracking-tight">{stats.cronJobCount}</p>
          </div>
        </div>

        {/* Daily Breakdown / Token usage status */}
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
            <span>LLM PROVIDER BUDGET</span>
            <span className="text-green-500 font-bold">{tokenCostFree}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Input (Context)</span>
              <span>{stats.totalInputTokens.toLocaleString()} tokens</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Output (Generated)</span>
              <span>{stats.totalOutputTokens.toLocaleString()} tokens</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 border-t pt-2">
            Using Google Gemini&apos;s free tier allows for generous usage limits without generating API invoices.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
