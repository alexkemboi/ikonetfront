"use client";

import { Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { UserSummary } from "@/lib/types/usersAccess";

const CARDS: { key: keyof UserSummary; label: string; hint: string }[] = [
  { key: "totalUsers", label: "Total users", hint: "Everyone registered or invited within the organisation: registered accounts plus open invitations." },
  { key: "registeredAccounts", label: "Registered portal accounts", hint: "People who have a portal account, whether it was created for them or they accepted an invitation." },
  { key: "activeUsers", label: "Active users", hint: "Accounts whose login is enabled (active and allowed to sign in). A temporarily locked account still counts." },
  { key: "administrators", label: "Administrators", hint: "Accounts whose role is privileged: the super admin, or a role allowed to assign roles to other people." },
  { key: "openInvitations", label: "Open invitations", hint: "Invitations sent and not yet accepted, revoked or expired." },
];

/** Compact dashboard figures, counted by the server on every load. */
export function SummaryCards({ summary, loading }: { summary: UserSummary | null; loading?: boolean }) {
  return (
    <section aria-label="User summary" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {CARDS.map((card) => (
        <div key={card.key} className="rounded-xl border border-border bg-card px-4 py-3 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs font-medium text-muted-foreground">{card.label}</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label={`About ${card.label}`} className="text-muted-foreground/70 hover:text-foreground">
                  <Info className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{card.hint}</TooltipContent>
            </Tooltip>
          </div>
          {loading || !summary ? (
            <Skeleton className="mt-2 h-7 w-12" />
          ) : (
            <p className="mt-1 text-2xl font-semibold tabular-nums">{summary[card.key].toLocaleString()}</p>
          )}
        </div>
      ))}
    </section>
  );
}
