"use client";

import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import type { z } from "zod";
import { Brain, Cpu, Zap } from "lucide-react";
import { allowedAnthropicModelSchema } from "~/server/api/routers/trustclaw/createInstance.schema";
import { MODELS } from "./onboarding.consts";
import { StepLayout, itemVariants } from "./step-layout";

const MODEL_ICONS: Record<string, React.ElementType> = {
  "claude-opus-4-6": Brain,
  "claude-sonnet-4-6-20251120": Cpu,
  "claude-sonnet-4-5-20250929": Cpu,
  "claude-3-7-sonnet-20250219": Brain,
  "claude-haiku-4-5-20251001": Zap,
  "claude-3-5-haiku-20241022": Zap,
};

interface ModelStepProps {
  value: z.infer<typeof allowedAnthropicModelSchema>;
  onChange: (model: z.infer<typeof allowedAnthropicModelSchema>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ModelStep({
  value,
  onChange,
  onNext,
  onBack,
}: ModelStepProps) {
  const handleModelChange = (val: string) => {
    const model = allowedAnthropicModelSchema.safeParse(val);
    if (!model.success) return;
    onChange(model.data);
  };

  return (
    <StepLayout
      title="Choose my brain!"
      subtitle="Which Claude model should power me?"
      onNext={onNext}
      onBack={onBack}
    >
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {MODELS.map((model) => {
            const Icon = MODEL_ICONS[model.value] ?? Cpu;
            const isSelected = value === model.value;
            return (
              <button
                key={model.value}
                onClick={() => handleModelChange(model.value)}
                className={cn(
                  "flex min-h-[44px] flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/40 hover:bg-muted/50",
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium">{model.label}</span>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-muted-foreground">{model.cost}</span>
                </div>
                <p className="text-xs text-muted-foreground">{model.description}</p>
              </button>
            );
          })}
        </div>
        <p className="text-muted-foreground mt-3 text-center text-xs">
          You can change this later in settings.
        </p>
      </motion.div>
    </StepLayout>
  );
}
