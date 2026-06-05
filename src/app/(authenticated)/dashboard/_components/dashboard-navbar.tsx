"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Lightbulb,
  LogOut,
  MessageCircle,
  PanelRight,
  Puzzle,
  Settings,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { ThemeToggle } from "~/components/core/theme-toggle";
import { TrustClawBrand } from "~/app/_components/trustclaw-brand";
import { authClient } from "~/clients/auth/react";
import { useTerminalStore } from "./terminal-store";
import { cn } from "~/lib/utils";

export function DashboardNavbar() {
  const pathname = usePathname();
  const isChat = pathname === "/dashboard";
  const isSettings = pathname.startsWith("/dashboard/settings");
  const isIdeas = pathname.startsWith("/dashboard/ideas");
  const isToolkits = pathname.startsWith("/dashboard/toolkits");
  const terminalOpen = useTerminalStore((s) => s.terminalOpen);
  const setTerminalOpen = useTerminalStore((s) => s.setTerminalOpen);
  const router = useRouter();
  const handleToggleTerminal = () => {
    setTerminalOpen(!terminalOpen);
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const navItems = [
    { href: "/dashboard", icon: MessageCircle, label: "Chat", active: isChat },
    { href: "/dashboard/ideas", icon: Lightbulb, label: "Ideas", active: isIdeas },
    { href: "/dashboard/toolkits", icon: Puzzle, label: "Toolkits", active: isToolkits },
    { href: "/dashboard/settings", icon: Settings, label: "Settings", active: isSettings },
  ];

  return (
    <header className="border-border bg-background/95 flex h-14 shrink-0 items-center justify-between border-b px-3 backdrop-blur md:px-4">
      <TrustClawBrand size="sm" logoLink="/dashboard" />

      {/* Mobile bottom-style nav items + Desktop icon-only */}
      <nav className="flex items-center gap-0.5 sm:gap-1">
        {navItems.map(({ href, icon: Icon, label, active }) => (
          <Tooltip key={href}>
            <TooltipTrigger asChild>
              <Link href={href}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-9 w-9 shrink-0",
                    active && "bg-accent text-accent-foreground",
                  )}
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}

        {isChat && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "hidden h-9 w-9 md:inline-flex",
                  terminalOpen && "bg-accent text-accent-foreground",
                )}
                onClick={handleToggleTerminal}
                aria-label="Toggle terminal"
              >
                <PanelRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {terminalOpen ? "Hide" : "Show"} Terminal
            </TooltipContent>
          </Tooltip>
        )}

        <div className="bg-border mx-1 hidden h-5 w-px sm:block" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="https://discord.gg/composio"
              target="_blank"
              aria-label="Discord"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
              >
                <Image
                  src="/images/icons/discord.webp"
                  alt="Discord"
                  width={16}
                  height={16}
                  className="h-4 w-4 dark:invert"
                />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>Discord</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ThemeToggle />
          </TooltipTrigger>
          <TooltipContent>Toggle theme</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => handleLogout()}
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Logout</TooltipContent>
        </Tooltip>
      </nav>
    </header>
  );
}
