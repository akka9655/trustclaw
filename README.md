# TrustClaw

**Your personal 24/7 AI assistant. _Runs free on Vercel._**

A self-hostable AI agent with 1000+ tool integrations via **Composio OAuth**, long-term vector memory, Telegram bot support, and scheduled automations — all running on the **Vercel Hobby (free) plan** with the **Gemini Flash** API.

> 🚀 **Live at** [trustclaw-green.vercel.app](https://trustclaw-green.vercel.app)

---

## ⚡ Quick Deploy (Vercel Free Tier)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fakka9655%2Ftrustclaw&project-name=trustclaw&repository-name=trustclaw&env=BETTER_AUTH_SECRET,GOOGLE_GENERATIVE_AI_API_KEY,CRON_SECRET&envDescription=See%20.env.example%20for%20details.%20GOOGLE_GENERATIVE_AI_API_KEY%20is%20FREE%20from%20https%3A%2F%2Faistudio.google.com%2Fapikey&envLink=https%3A%2F%2Fgithub.com%2Fakka9655%2Ftrustclaw%23environment-variables&products=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%5D&skippable-integrations=1)

**All you need:**

| Requirement | Cost | Where to get it |
|---|---|---|
| Vercel account | **Free** | [vercel.com](https://vercel.com) |
| Neon Postgres | **Free** | Auto-provisioned via deploy button |
| Google AI API key | **Free** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Composio API key | **Free** _(optional)_ | [composio.dev](https://dashboard.composio.dev/login?flow=developer) |

**Zero cost to run.** Gemini Flash is free-tier, Neon Postgres is free-tier, Vercel Hobby is free.

---

## ✨ Features

| | |
|---|---|
| 🤖 **Gemini Flash Powered** | Uses Google's free Gemini 2.5 Flash API — no paid LLM keys needed. |
| 🔐 **OAuth Integrations** | 1000+ apps via Composio (Gmail, GitHub, Slack, Notion, Sheets, Calendar…). No passwords shared. |
| 🧠 **Long-Term Memory** | Postgres + pgvector for persistent vector memory across conversations. |
| 💤 **Works While You Sleep** | Cron-scheduled tasks run on autopilot (daily on Hobby plan). |
| 📱 **Telegram Bot** | Chat with your agent from Telegram — optional setup. |
| 🎯 **37+ Automation Templates** | Pre-built prompts for crypto tracking, diet coaching, GitHub automation, and more. |
| 🛡️ **Sandboxed Execution** | Every tool call runs in an isolated cloud environment. |
| ⚡ **PWA Support** | Install as an app on your phone for instant access. |

---

## 🏗 Architecture

```
┌──────────────┐    ┌──────────────────────────────────────────┐
│  Web (Next)  │───▶│             Next.js 15 App               │
│   Telegram   │───▶│  ┌────────────────────────────────────┐  │
│     Cron     │───▶│  │  tRPC API + Agent Runtime          │  │
└──────────────┘    │  │  (Gemini Flash + Composio Tools)   │  │
                    │  └─────────┬──────────────────────────┘  │
                    │            │                              │
                    │   ┌────────┼─────────┬──────────┐        │
                    │   ▼        ▼         ▼          ▼        │
                    │ Postgres  Redis   Gemini API  Composio   │
                    │ (pgvector) (opt)  (FREE)                 │
                    └──────────────────────────────────────────┘
```

### Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org) (App Router) + React 19
- **Backend:** [tRPC](https://trpc.io) — all backend logic
- **Auth:** [Better Auth](https://www.better-auth.com/) — username/password login
- **Database:** [Prisma](https://prisma.io) + [Neon Postgres](https://neon.tech) + [pgvector](https://github.com/pgvector/pgvector)
- **AI:** [Google Gemini Flash](https://aistudio.google.com) via Vercel AI SDK — **completely free**
- **Tools:** [Composio SDK](https://composio.dev) — 1000+ OAuth integrations
- **Styling:** [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Caching:** Redis via [Upstash](https://upstash.com) _(optional, free tier available)_

---

## ⚠️ Vercel Hobby Plan Limits

Running on the free Hobby plan works great, but be aware of these limits:

| Limit | Hobby (Free) | Pro ($20/mo) |
|---|---|---|
| Cron frequency | Once per day | Per minute |
| Function timeout | 60 seconds | 300 seconds |
| Bandwidth | 100 GB/mo | 1 TB/mo |
| Serverless executions | 100K/mo | 1M/mo |

**Tips for staying within free limits:**
- The Gemini Flash free tier allows **15 requests/min** and **1,500 requests/day**
- Token context is squeezed to ~4,000 tokens to maximize efficiency
- Rate limiting is built-in and enabled by default
- Cron jobs auto-adjust to daily schedule on Hobby plan

---

## 🧰 Local Development

```bash
# 1. Clone and install
git clone https://github.com/akka9655/trustclaw.git && cd trustclaw
pnpm install

# 2. Set up environment
cp .env.example .env
# Fill in: DATABASE_URL, BETTER_AUTH_SECRET, GOOGLE_GENERATIVE_AI_API_KEY

# 3. Push database schema
pnpm prisma db push

# 4. Run dev server
pnpm dev
# → http://localhost:3000
```

### Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon Postgres connection string (with pgvector) |
| `BETTER_AUTH_SECRET` | ✅ | Session signing key — `openssl rand -base64 32` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | ✅ | **FREE** from [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `CRON_SECRET` | ✅ | Cron endpoint auth — `openssl rand -base64 32` |
| `COMPOSIO_API_KEY` | ❌ | Enable tool integrations (Gmail, GitHub, etc.) |
| `REDIS_URL` | ❌ | Resumable streams + rate limiting ([Upstash](https://upstash.com) free) |
| `TELEGRAM_BOT_TOKEN` | ❌ | Telegram bot via [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_BOT_USERNAME` | ❌ | Telegram bot username |
| `TELEGRAM_WEBHOOK_SECRET` | ❌ | Telegram webhook auth |

See [`.env.example`](./.env.example) for the full template with descriptions.

---

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes (auth, tRPC, cron, telegram)
│   ├── (authenticated)/          # Protected dashboard routes
│   │   └── dashboard/
│   │       ├── page.tsx          # Main chat interface
│   │       ├── ideas/            # 37+ automation templates
│   │       ├── settings/         # Agent configuration
│   │       └── toolkits/         # Composio integrations
│   └── _components/              # Landing page components
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   └── core/                     # Shared components
├── server/
│   ├── api/routers/trustclaw/    # tRPC procedures + agent runtime
│   └── clients/                  # DB, Redis, Composio, Telegram clients
└── styles/globals.css            # Theme + design tokens
```

---

## 📝 License

MIT — see [LICENSE](./LICENSE).

Built with [Composio](https://composio.dev) for tool integrations. Powered by [Google Gemini](https://aistudio.google.com).
