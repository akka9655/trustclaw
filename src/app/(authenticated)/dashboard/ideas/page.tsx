"use client";

import { Zap, Sparkles, Code, Briefcase, Bitcoin, Calendar, HeartPulse } from "lucide-react";
import { useRouter } from "next/navigation";
import { showSuccessToast } from "~/components/core/toast-notifications";

const AUTOMATIONS = [
  {
    title: "Daily Crypto & Market Briefing",
    description: "Fetches the latest Bitcoin price, trends, and news every morning.",
    prompt: "Set up a daily cron job at 8 AM to fetch the latest Bitcoin price, crypto trends, and trading news, and send me a morning briefing via Telegram.",
    icon: Bitcoin,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    prerequisites: ["Telegram Notification Setup"],
  },
  {
    title: "Trading & Business Journal",
    description: "Logs your trades, entries, and business ideas instantly.",
    prompt: "Connect to Notion or Google Sheets via Composio and create a 'Trading & Business Journal'. Log this idea: [Type your trade or business idea here]",
    icon: Briefcase,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    prerequisites: ["Composio: Notion or Google Sheets"],
  },
  {
    title: "Open-Source 'Good First Issue' Hunter",
    description: "Automatically finds easy issues in top React and software repos.",
    prompt: "Search GitHub using Composio for 3 'good first issue' tasks related to React, software, or electronics, and summarize them for me so I can start contributing.",
    icon: Code,
    color: "text-green-500",
    bg: "bg-green-500/10",
    prerequisites: ["Composio: GitHub"],
  },
  {
    title: "Smart Workout & Calendar Scheduler",
    description: "Blocks out gym time intelligently around your schedule.",
    prompt: "Connect to my Google Calendar via Composio, look at my schedule for this week, and automatically block out 1-hour slots for my fat loss gym workouts.",
    icon: Calendar,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    prerequisites: ["Composio: Google Calendar"],
  },
  {
    title: "Weekly HackerNews Digest",
    description: "Scrapes the best software and electronics news every Friday.",
    prompt: "Set up a weekly cron job every Friday evening to search for the top posts from HackerNews (software and tech) and send me a digest summary.",
    icon: Zap,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    prerequisites: ["Telegram Notification Setup"],
  },
  {
    title: "YouTube Tech Summarizer",
    description: "Summarizes long electronics or software tutorials into Notion.",
    prompt: "I am going to send you YouTube video links. When I do, extract the transcript or key concepts, and save a beautiful summary to my 'Tech Learning' Notion database.",
    icon: Code,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    prerequisites: ["Composio: Notion", "Composio: YouTube"],
  },
  {
    title: "Strict 9PM Diet Interrogation",
    description: "Forces you to stay accountable for fat loss every single night.",
    prompt: "Set up a daily cron job at 9:00 PM to message me on Telegram asking: 'Coach here. What did you eat today, and did you hit your protein goals?'. If I reply, log it to my Google Sheet.",
    icon: HeartPulse,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    prerequisites: ["Telegram Notification Setup", "Composio: Google Sheets"],
  },
  {
    title: "Y Combinator Startup Planner",
    description: "Turns your raw idea into a step-by-step launch roadmap.",
    prompt: "Act as a strict Y Combinator startup advisor. I am going to give you my startup idea. You will: 1. Brutally validate if people actually want it. 2. Give me a 7-day MVP (Minimum Viable Product) coding roadmap. 3. Tell me exactly how to get my first 10 users.",
    icon: Briefcase,
    color: "text-blue-600",
    bg: "bg-blue-600/10",
    prerequisites: ["None"],
  },
  {
    title: "Startup & OS Networking Drafter",
    description: "Drafts perfect cold emails to tech founders or OS maintainers.",
    prompt: "Connect to my Gmail via Composio. Help me draft a professional cold email to a software maintainer offering my help with 'good first issues'. Save it to my drafts, do not send.",
    icon: Briefcase,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    prerequisites: ["Composio: Gmail"],
  },
  {
    title: "GitHub Trending Tech Radar",
    description: "Finds the fastest-growing open-source projects every week.",
    prompt: "Scan GitHub for the top trending repositories in TypeScript and Python this week. Summarize what they do so I can stay ahead of the newest software tools.",
    icon: Code,
    color: "text-teal-500",
    bg: "bg-teal-500/10",
    prerequisites: ["Composio: GitHub"],
  },
  {
    title: "Auto Certificate Generator",
    description: "Reads your uploaded sheet and bulk-emails certificates (Token Efficient).",
    prompt: "I am attaching a CSV/Sheet with names and emails. Loop through every row. To save tokens, do NOT print the output in this chat. Just silently call the Composio Gmail tool for each row to generate and email a 'Certificate of Completion'.",
    icon: Sparkles,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    prerequisites: ["File Upload (Chat)", "Composio: Gmail"],
  },
  {
    title: "Google Sheets Cold Email CRM",
    description: "Sends personalized outreach emails from a spreadsheet list.",
    prompt: "Read my 'Cold Outreach' Google Sheet. For every row where 'Status' is empty, draft a highly personalized cold email to the 'Company Name' using my Gmail, send it, and update the 'Status' to 'Sent'.",
    icon: Briefcase,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    prerequisites: ["Composio: Google Sheets", "Composio: Gmail"],
  },
  {
    title: "GitHub Auto-Project Initializer",
    description: "Creates repos, sets up branch protection, and writes READMEs.",
    prompt: "Connect to my GitHub. I want to build a new app called 'Crypto-Tracker'. Create a new private repository, set up 'main' branch protection, and commit a beautiful, detailed README.md file to get me started.",
    icon: Code,
    color: "text-emerald-600",
    bg: "bg-emerald-600/10",
    prerequisites: ["Composio: GitHub"],
  },
  {
    title: "GitHub Code Review Tutor",
    description: "Explains complex Pull Requests so you can learn from senior devs.",
    prompt: "I am going to send you a link to an open Pull Request on GitHub. Read the code diffs and explain exactly what the developer fixed and why, like I am a beginner.",
    icon: Code,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    prerequisites: ["Composio: GitHub"],
  },
  {
    title: "Business Capital & Expense Tracker",
    description: "Logs your spending to help you save money for trading and business.",
    prompt: "Whenever I tell you I bought something, categorize the expense and log the price into my 'Business Capital' Google Sheet so I can track my savings.",
    icon: Bitcoin,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    prerequisites: ["Composio: Google Sheets"],
  },
  {
    title: "Strict Food Coach Logger",
    description: "Logs your meals directly into the Basith Tracker.",
    prompt: "Here is what I ate: [Type food]. Analyze it for fat loss, calculate the protein/calories, and log it to my Basith Fat Loss Tracker sheet.",
    icon: HeartPulse,
    color: "text-red-500",
    bg: "bg-red-500/10",
    prerequisites: ["Composio: Google Sheets"],
  },
  {
    title: "TikTok & Shorts Scriptwriter",
    description: "Generates viral 60-second video scripts from trending tech topics.",
    prompt: "Scan Google Trends for 'AI tools' or 'Crypto'. Write a highly engaging 60-second video script with a catchy hook that I can read for my YouTube Shorts.",
    icon: Sparkles,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    prerequisites: ["None"],
  },
  {
    title: "Learn-in-Public Auto-Tweeter",
    description: "Automatically writes insightful Tweets whenever you push code.",
    prompt: "Connect to my GitHub. Read my latest commit on the 'main' branch. Write an insightful, professional Tweet about what I just built and post it to my Twitter account.",
    icon: Zap,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    prerequisites: ["Composio: GitHub", "Composio: Twitter"],
  },
  {
    title: "Copycat UI & Tailwind Reverser",
    description: "Generates Tailwind code for any website design you like.",
    prompt: "I am going to send you a link to a website. Analyze its hero section design (colors, typography) and generate the exact Next.js and Tailwind CSS code needed to replicate it.",
    icon: Code,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
    prerequisites: ["None"],
  },
  {
    title: "Arbitrage Price-Flipper",
    description: "Finds underpriced electronics online to buy and resell.",
    prompt: "Scan eBay or Facebook Marketplace for 'MacBook M1' or 'Arduino Kits' listed under market value in the last 24 hours. Send me the links so I can buy them and flip them.",
    icon: Bitcoin,
    color: "text-green-500",
    bg: "bg-green-500/10",
    prerequisites: ["None"],
  },
  {
    title: "Kindle to Anki Flashcards",
    description: "Turns your book highlights into quiz flashcards.",
    prompt: "Read the book highlights file I just attached. Extract the core concepts, convert them into Question/Answer pairs, and format them as a CSV I can import into Anki.",
    icon: Briefcase,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    prerequisites: ["File Upload (Chat)"],
  },
  {
    title: "Silent Mentor Observer",
    description: "Spies on what top 10x developers are secretly coding.",
    prompt: "Scan the recent GitHub activity of the creators of React and Next.js. Summarize exactly what obscure libraries or code they have been experimenting with this week.",
    icon: Sparkles,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    prerequisites: ["Composio: GitHub"],
  },
  {
    title: "SaaS Free-Trial Maximizer",
    description: "Finds free trials and reminds you to cancel before being billed.",
    prompt: "Find me a legal free trial for [Expensive Tool]. Add a strict event to my Google Calendar 1 day before the trial ends so I remember to cancel my credit card.",
    icon: Calendar,
    color: "text-red-400",
    bg: "bg-red-400/10",
    prerequisites: ["Composio: Google Calendar"],
  },
  {
    title: "Deep Web Scraper",
    description: "Reads live websites to bypass blocks and fetch data.",
    prompt: "Scrape the live HTML of [URL] using your web fetcher tool. Extract the main pricing data or news headlines, and format it nicely for me.",
    icon: Code,
    color: "text-slate-500",
    bg: "bg-slate-500/10",
    prerequisites: ["None"],
  },
  {
    title: "Crypto Paper Trading Simulator",
    description: "Practice trading Bitcoin without risking real money.",
    prompt: "I want to open a paper-trade. Buy 1 Bitcoin at the current market price. Save this trade to my 'Paper Trading' Google Sheet so we can track my PNL tomorrow.",
    icon: Bitcoin,
    color: "text-green-600",
    bg: "bg-green-600/10",
    prerequisites: ["Composio: Google Sheets"],
  },
  {
    title: "Telegram Voice-to-Action",
    description: "Transcribes voice notes and executes the commands.",
    prompt: "I will send you audio notes via Telegram. You will use an API to transcribe them. If I talk about a business idea, log it to Notion. If I talk about food, log it to my Diet Tracker.",
    icon: Zap,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    prerequisites: ["Telegram Notification Setup"],
  },
  {
    title: "Smart Calendar Defragmenter",
    description: "Rearranges meetings to give you long coding blocks.",
    prompt: "Analyze my Google Calendar for next week. Reschedule all my flexible 30-minute meetings to Friday afternoon so I have 4-hour uninterrupted coding blocks on Monday and Tuesday.",
    icon: Calendar,
    color: "text-indigo-600",
    bg: "bg-indigo-600/10",
    prerequisites: ["Composio: Google Calendar"],
  },
  {
    title: "Grocery List Generator",
    description: "Builds a high-protein shopping list based on your goals.",
    prompt: "Look at my recent food logs. Generate a grocery list for the next 7 days that ensures I hit 130g of protein and stay under 2000 calories daily. Save it to my Notion.",
    icon: HeartPulse,
    color: "text-rose-600",
    bg: "bg-rose-600/10",
    prerequisites: ["Composio: Notion"],
  },
  {
    title: "Automated Portfolio Balancer",
    description: "Calculates the exact trades needed to fix your portfolio ratio.",
    prompt: "Connect to my Binance via Composio. My goal is a 50% BTC and 50% ETH ratio. Look at my current balances and tell me exactly how much of what to buy or sell.",
    icon: Bitcoin,
    color: "text-amber-600",
    bg: "bg-amber-600/10",
    prerequisites: ["Composio: Binance"],
  },
  {
    title: "Whale Wallet Tracker",
    description: "Monitors top Bitcoin wallets for massive market moves.",
    prompt: "Set up a daily cron job to check the blockchain for the top 5 Bitcoin whale wallets. If they move more than 1000 BTC, send me an urgent Telegram alert.",
    icon: Sparkles,
    color: "text-cyan-600",
    bg: "bg-cyan-600/10",
    prerequisites: ["Telegram Notification Setup"],
  },
  {
    title: "Paid Open-Source Bounty Hunter",
    description: "Finds GitHub issues that will pay you real cash.",
    prompt: "Scan Gitcoin and GitHub for 'Paid Bounties' that involve simple React or CSS bug fixes. Send me the links so I can fix them and get paid.",
    icon: Briefcase,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    prerequisites: ["Composio: GitHub"],
  },
  {
    title: "Shower Thoughts to Business Plan",
    description: "Turns messy half-ideas into professional Notion plans.",
    prompt: "Here is my random idea: [Idea]. Research the market, find 3 competitors, write a 1-page business plan, and save it beautifully to my Notion.",
    icon: Sparkles,
    color: "text-fuchsia-500",
    bg: "bg-fuchsia-500/10",
    prerequisites: ["Composio: Notion"],
  },
  {
    title: "Repo Reader Auto-Documentation",
    description: "Clones and reads complex GitHub code for you.",
    prompt: "Clone this GitHub repository link I provide. Read the source code, explain its architecture, and tell me exactly how I can use its core functions in my Next.js app.",
    icon: Code,
    color: "text-slate-600",
    bg: "bg-slate-600/10",
    prerequisites: ["Composio: GitHub"],
  },
  {
    title: "Competitor Teardown",
    description: "Analyzes a competitor's website for copywriting gold.",
    prompt: "Scrape [Competitor URL]. Analyze their pricing model, target audience, and weaknesses. Generate a strategy for how my startup can steal their customers.",
    icon: Zap,
    color: "text-orange-600",
    bg: "bg-orange-600/10",
    prerequisites: ["None"],
  },
  {
    title: "Product Hunt Launchpad",
    description: "Drafts the perfect Product Hunt launch campaign.",
    prompt: "I am launching my new app. Write my Product Hunt description, generate an engaging tagline, draft 5 promotional Tweets, and create a Reddit launch post for me.",
    icon: Briefcase,
    color: "text-pink-600",
    bg: "bg-pink-600/10",
    prerequisites: ["None"],
  },
  {
    title: "Startup Pitch Deck Builder",
    description: "Automatically writes slide copy for your investor pitch.",
    prompt: "Create the textual outline for a 10-slide startup pitch deck based on my idea. Include Problem, Solution, Market Size, Business Model, and Ask. Keep it concise.",
    icon: Sparkles,
    color: "text-blue-600",
    bg: "bg-blue-600/10",
    prerequisites: ["None"],
  },
  {
    title: "Freelance Client Hunter",
    description: "Finds jobs and auto-drafts perfect Upwork proposals.",
    prompt: "Scan Reddit r/forhire and Upwork RSS feeds for 'React Developer' jobs. Draft highly personalized cover letters for the 3 most recent posts.",
    icon: Briefcase,
    color: "text-teal-600",
    bg: "bg-teal-600/10",
    prerequisites: ["None"],
  },
  {
    title: "Gmail Unanswered Follow-Up",
    description: "Detects ignored emails and drafts polite follow-ups.",
    prompt: "Scan my Sent emails in Gmail from the last 7 days. Find important emails to clients or founders that haven't received a reply, and draft polite, 2-sentence follow-up emails.",
    icon: Zap,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    prerequisites: ["Composio: Gmail"],
  },
  {
    title: "Gmail Invoice to Sheets Logger",
    description: "Automatically extracts receipts from emails and logs expenses.",
    prompt: "Search my Gmail for recent emails containing 'Receipt', 'Invoice', or 'Payment'. Extract the total amount and merchant name, and log them into my 'Business Expenses' Google Sheet.",
    icon: Bitcoin,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    prerequisites: ["Composio: Gmail", "Composio: Google Sheets"],
  },
  {
    title: "GitHub Auto-Triage Labeler",
    description: "Automatically labels and categorizes incoming GitHub issues.",
    prompt: "Connect to my GitHub repository. Read all new Issues created today. If the issue mentions a crash or error, label it 'bug'. If it asks for something new, label it 'enhancement'.",
    icon: Code,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    prerequisites: ["Composio: GitHub"],
  },
  {
    title: "GitHub Stale PR Closer",
    description: "Cleans up your repos by notifying inactive contributors.",
    prompt: "Scan my open Pull Requests on GitHub. If a PR has been open for more than 14 days without activity, post a comment asking if they need help, or politely close it.",
    icon: Sparkles,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    prerequisites: ["Composio: GitHub"],
  },
  {
    title: "Sheets Subscription Tracker",
    description: "Analyzes your subscriptions to stop you from overspending.",
    prompt: "Read my 'Monthly Subscriptions' Google Sheet. Calculate my total monthly burn rate, identify the 2 most expensive subscriptions, and remind me via Telegram to cancel them if unused.",
    icon: Calendar,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    prerequisites: ["Composio: Google Sheets", "Telegram Notification Setup"],
  },
  {
    title: "Daily Habit & Consistency Logger",
    description: "Telegram bot that pesters you until you log your daily habits.",
    prompt: "Set up a 10 PM cron job. Message me on Telegram asking: 'Did you code for 2 hours today?'. If I say yes, add a green checkmark to today's row in my 'Consistency' Google Sheet.",
    icon: HeartPulse,
    color: "text-red-500",
    bg: "bg-red-500/10",
    prerequisites: ["Telegram Notification Setup", "Composio: Google Sheets"],
  },
];

export default function IdeasPage() {
  const router = useRouter();

  const handleCopyAndGo = async (prompt: string) => {
    router.push(`/dashboard?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-3 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/30 to-purple-500/20 blur-lg" />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 shadow-md shadow-primary/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Automations</h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Tap any card → prompt copied → paste in chat
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
          {AUTOMATIONS.map((auto) => (
            <button
              key={auto.title}
              onClick={() => handleCopyAndGo(auto.prompt)}
              className="flex flex-col rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 text-left active:scale-[0.98] cursor-pointer"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${auto.bg}`}>
                  <auto.icon className={`h-4 w-4 ${auto.color}`} />
                </div>
                <h3 className="text-sm font-semibold leading-tight">{auto.title}</h3>
              </div>

              <p className="mb-3 text-xs text-muted-foreground flex-1 leading-relaxed">
                {auto.description}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {auto.prerequisites.map((req) => (
                  <span
                    key={req}
                    className="rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {req}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
          <div className="mb-4 flex items-center gap-2 text-destructive">
            <Sparkles className="h-5 w-5" />
            <h3 className="text-lg font-bold">System Limitations (Free Tier)</h3>
          </div>
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Vercel Cron Limit:</strong> Background automations (cron jobs) can only run <strong>once per day</strong> on the Vercel Hobby plan.
            </li>
            <li>
              <strong className="text-foreground">Execution Timeout:</strong> The agent has a strict 5-minute time limit to complete any task.
            </li>
            <li>
              <strong className="text-foreground">Gemini API Limits:</strong> The free tier limits you to 15 requests per minute, and 1,500 requests per day. The token context is squeezed to 4,000 to maximize this.
            </li>
            <li>
              <strong className="text-foreground">Composio OAuth:</strong> Your connected apps might disconnect if they are inactive for several weeks, requiring a simple re-login in the Toolkits tab.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
