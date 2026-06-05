"use client";

import { BarChart3, Database, MessageSquare, ShieldAlert, Cpu, CalendarClock, RotateCcw } from "lucide-react";
import { trpc } from "~/clients/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

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
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = data ?? {
    totalMessages: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    todayMessages: 0,
    todayInputTokens: 0,
    todayOutputTokens: 0,
    dailyMessages: [],
    memoryCount: 0,
    cronJobCount: 0,
  };

  const todayInput = stats.todayInputTokens ?? 0;
  const todayOutput = stats.todayOutputTokens ?? 0;
  const todayMsgs = stats.todayMessages ?? 0;
  const todayTokens = todayInput + todayOutput;
  const totalTokens = stats.totalInputTokens + stats.totalOutputTokens;

  // Gemini free tier: 1,500 RPD (requests per day)
  const DAILY_REQUEST_LIMIT = 1500;
  const usagePercent = Math.min((todayMsgs / DAILY_REQUEST_LIMIT) * 100, 100);

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
      <CardContent className="space-y-5">
        {/* Today's Usage - Primary Display */}
        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Today&apos;s Usage</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <RotateCcw className="h-3 w-3" />
              Resets at midnight UTC
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-background/60 p-2.5 text-center">
              <p className="text-lg font-bold tracking-tight text-primary">{todayMsgs}</p>
              <p className="text-[10px] text-muted-foreground">Requests</p>
            </div>
            <div className="rounded-lg bg-background/60 p-2.5 text-center">
              <p className="text-lg font-bold tracking-tight">{formatTokens(todayInput)}</p>
              <p className="text-[10px] text-muted-foreground">Input</p>
            </div>
            <div className="rounded-lg bg-background/60 p-2.5 text-center">
              <p className="text-lg font-bold tracking-tight">{formatTokens(todayOutput)}</p>
              <p className="text-[10px] text-muted-foreground">Output</p>
            </div>
          </div>

          {/* Daily limit progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Daily API Limit</span>
              <span>{todayMsgs} / {DAILY_REQUEST_LIMIT.toLocaleString()} requests</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* All-time Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-3 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] sm:text-xs">Total Chats</span>
              <MessageSquare className="h-3.5 w-3.5" />
            </div>
            <p className="text-lg font-bold tracking-tight">{stats.totalMessages}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] sm:text-xs">All Tokens</span>
              <Cpu className="h-3.5 w-3.5" />
            </div>
            <p className="text-lg font-bold tracking-tight">{formatTokens(totalTokens)}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] sm:text-xs">Memories</span>
              <Database className="h-3.5 w-3.5" />
            </div>
            <p className="text-lg font-bold tracking-tight">{stats.memoryCount}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] sm:text-xs">Active Crons</span>
              <ShieldAlert className="h-3.5 w-3.5" />
            </div>
            <p className="text-lg font-bold tracking-tight">{stats.cronJobCount}</p>
          </div>
        </div>

        {/* Free tier note */}
        <div className="rounded-xl border border-border bg-muted/20 px-3.5 py-3 space-y-1.5">
          <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
            <span>LLM PROVIDER</span>
            <span className="text-green-500 font-bold">Free Tier (No Cost)</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Gemini&apos;s free tier resets every 24 hours. Today&apos;s tokens ({formatTokens(todayTokens)}) reset at midnight UTC.
            All-time tokens ({formatTokens(totalTokens)}) are tracked for your reference only.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
