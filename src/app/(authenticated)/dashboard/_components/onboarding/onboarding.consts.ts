export const STEP_ORDER = [
  "name",
  "writing-style",
  "personality",
  "emoji",
  "lore",
  "model",
  "integrations",
  "telegram",
] as const;

export type Step = (typeof STEP_ORDER)[number];

export const WRITING_STYLES = [
  { key: "lowercase", label: "no caps, no stress" },
  { key: "professional", label: "crisp & polished" },
  { key: "friendly", label: "like texting a friend" },
  { key: "playful", label: "delightfully unhinged" },
] as const;

export type WritingStyleKey = (typeof WRITING_STYLES)[number]["key"];

export const PERSONALITIES = [
  { key: "kind", label: "your personal cheerleader" },
  { key: "sassy", label: "says what you're thinking" },
  { key: "energetic", label: "runs on espresso" },
  { key: "curious", label: "down every rabbit hole" },
] as const;

export type PersonalityKey = (typeof PERSONALITIES)[number]["key"];

export const CURATED_EMOJIS = [
  "\u{1F319}", "\u26A1", "\u{1F525}", "\u{1F48E}", "\u{1F30A}", "\u{1F3AF}",
  "\u{1F98A}", "\u{1F419}", "\u{1F98B}", "\u{1F433}", "\u{1F989}", "\u{1F438}",
  "\u{1F680}", "\u{1F3AE}", "\u{1F3B8}", "\u{1F3A8}", "\u{1F52E}", "\u{1F9E0}",
  "\u2728", "\u{1F4AB}", "\u{1F338}", "\u{1F340}", "\u2600\uFE0F", "\u{1F308}",
] as const;

export const MODELS = [
  {
    value: "gemini-2.5-flash" as const,
    label: "Gemini 2.5 Flash",
    description: "Default · Free · Unlimited · 1M context",
    cost: "Free",
  },
  {
    value: "github-gpt-4.1-nano" as const,
    label: "GPT-4.1 Nano",
    description: "Fastest OpenAI · 150 req/day",
    cost: "Free",
  },
  {
    value: "github-gpt-4.1-mini" as const,
    label: "GPT-4.1 Mini",
    description: "Best coding & instructions · 150 req/day",
    cost: "Free",
  },
  {
    value: "github-gpt-4o-mini" as const,
    label: "GPT-4o Mini",
    description: "Stable for agents · 150 req/day",
    cost: "Free",
  },
  {
    value: "github-gpt-4o" as const,
    label: "GPT-4o",
    description: "Advanced multimodal · 50 req/day",
    cost: "Free",
  },
  {
    value: "github-o4-mini" as const,
    label: "OpenAI o4-mini",
    description: "Reasoning model · 50 req/day",
    cost: "Free",
  },
  {
    value: "github-llama-3.1-8b-instruct" as const,
    label: "Llama 3.1 8B",
    description: "Compact & fast · 150 req/day",
    cost: "Free",
  },
  {
    value: "github-llama-3.3-70b-instruct" as const,
    label: "Llama 3.3 70B",
    description: "Strong reasoning · 50 req/day",
    cost: "Free",
  },
  {
    value: "github-phi-4-mini-instruct" as const,
    label: "Phi-4 Mini",
    description: "4GB RAM friendly · 150 req/day",
    cost: "Free",
  },
  {
    value: "github-phi-4" as const,
    label: "Phi-4 14B",
    description: "Low latency · reasoning · 50 req/day",
    cost: "Free",
  },
  {
    value: "github-deepseek-v3" as const,
    label: "DeepSeek-V3",
    description: "Code & function calling · 50 req/day",
    cost: "Free",
  },
  {
    value: "github-deepseek-r1" as const,
    label: "DeepSeek-R1",
    description: "Deep reasoning chain · 50 req/day",
    cost: "Free",
  },
  {
    value: "github-mistral-small" as const,
    label: "Mistral Small 3.1",
    description: "128K context · multimodal · 150 req/day",
    cost: "Free",
  },
  {
    value: "github-grok-3-mini" as const,
    label: "Grok 3 Mini",
    description: "Logic & math · lightweight · 150 req/day",
    cost: "Free",
  },
] as const;

export const INTEGRATION_DESCRIPTIONS: Record<string, string> = {
  gmail: "Read and send emails",
  github: "Manage repos and issues",
  slack: "Send and read messages",
};

export const WRITING_STYLE_ITEM_MAP: Record<WritingStyleKey, string> = {
  lowercase: "phone",
  professional: "briefcase",
  friendly: "heart",
  playful: "partyhat",
};

export const PERSONALITY_OUTFIT_MAP: Record<PersonalityKey, string> = {
  kind: "pompoms",
  sassy: "sunglasses",
  energetic: "coffee",
  curious: "nerdglasses",
};
