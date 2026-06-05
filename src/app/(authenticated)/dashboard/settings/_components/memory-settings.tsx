"use client";

import { useState } from "react";
import { Brain, Plus, Trash2, BookOpen } from "lucide-react";
import moment from "moment";
import { trpc } from "~/clients/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Skeleton } from "~/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { toast } from "sonner";

export function MemorySettings() {
  const utils = trpc.useUtils();
  const [newFact, setNewFact] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const { data, isLoading } = trpc.trustclaw.getMemories.useQuery({
    limit: 50,
  });

  const addMemory = trpc.trustclaw.addMemory.useMutation({
    onSuccess: () => {
      setNewFact("");
      setIsAdding(false);
      void utils.trustclaw.getMemories.invalidate();
      toast.success("Memory saved — the agent will always know this.");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMemory = trpc.trustclaw.deleteMemory.useMutation({
    onSuccess: () => {
      void utils.trustclaw.getMemories.invalidate();
      toast.success("Memory deleted.");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAdd = () => {
    const trimmed = newFact.trim();
    if (!trimmed) return;
    addMemory.mutate({ content: trimmed });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Permanent Memory
            </CardTitle>
            <CardDescription>
              Facts the agent always knows — injected into every conversation.
              Use this for preferences, personal details, or standing instructions.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setIsAdding((v) => !v)}
            variant={isAdding ? "outline" : "default"}
            className="shrink-0 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            {isAdding ? "Cancel" : "Add"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add form */}
        {isAdding && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
            <p className="text-xs font-medium text-primary">New memory fact</p>
            <Textarea
              placeholder={`Examples:\n• My name is Basith, I weigh 63kg, goal: fat loss\n• Always log food to "Basith Fat Loss Tracker" sheet\n• My GitHub username is akka9655\n• Preferred language: Python`}
              value={newFact}
              onChange={(e) => setNewFact(e.target.value)}
              rows={4}
              className="resize-none text-sm"
              autoFocus
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {newFact.length} / 500 chars
              </p>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!newFact.trim() || newFact.length > 500 || addMemory.isPending}
              >
                {addMemory.isPending ? "Saving..." : "Save Memory"}
              </Button>
            </div>
          </div>
        )}

        {/* Memory list */}
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <BookOpen className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No memories yet.</p>
            <p className="text-xs text-muted-foreground/60">
              Click <span className="font-medium">Add</span> to save a permanent fact the agent will always know.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {data.items.map((memory) => (
              <li
                key={memory.id}
                className="group flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-sm text-foreground leading-snug break-words">
                    {memory.content}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    Added {moment(memory.createdAt).fromNow()}
                  </span>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                      disabled={deleteMemory.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this memory?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The agent will no longer know this fact. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMemory.mutate({ memoryId: memory.id })}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
