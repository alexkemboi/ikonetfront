"use client";

import { useState } from "react";
import { Popover } from "radix-ui";
import { ChevronDown, HelpCircle } from "lucide-react";
import { COLOUR_LEGEND, NETWORK_HEALTH_HELP, type HelpKey } from "@/lib/help/networkHealthHelp";
import { cn } from "@/lib/utils";

const DOT: Record<string, string> = {
  green: "bg-emerald-500",
  red: "bg-red-500",
  amber: "bg-amber-500",
  grey: "bg-muted-foreground/40",
};

/** A small "?" that explains one term in plain words. */
export function HelpTip({ term, className }: { term: HelpKey; className?: string }) {
  const entry = NETWORK_HEALTH_HELP[term];
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`What "${entry.title}" means`}
          className={cn("inline-flex align-middle text-muted-foreground hover:text-foreground", className)}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          className="z-50 max-w-sm rounded-lg border border-border bg-popover p-3 text-left text-sm normal-case tracking-normal text-popover-foreground shadow-lg"
        >
          <p className="font-medium">{entry.title}</p>
          <p className="mt-1 text-muted-foreground">{entry.means}</p>
          {"why" in entry && entry.why && <p className="mt-2"><span className="font-medium">Why it matters: </span>{entry.why}</p>}
          {"todo" in entry && entry.todo && <p className="mt-2"><span className="font-medium">What to do: </span>{entry.todo}</p>}
          <Popover.Arrow className="fill-border" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

const GROUPS: { heading: string; terms: HelpKey[] }[] = [
  { heading: "Can customers sign in?", terms: ["customerSignIn", "signInWorking", "signInNotWorking", "signInNoAttempts", "signInNotSetUp", "signInUnknown"] },
  { heading: "RADIUS password", terms: ["radiusPassword", "passwordCurrent", "passwordOutOfDate", "passwordUnknown"] },
  { heading: "Router clock", terms: ["routerClock", "clockRight", "clockWrong", "clockNoTimeServer", "clockUnknown"] },
  { heading: "Customers and addresses", terms: ["customerDevices", "wrongAddress", "rogueDhcp"] },
  { heading: "Access points", terms: ["accessPoints", "apSeen", "apNotSeen", "apIgnored"] },
  { heading: "Router status", terms: ["statusHealthy", "statusAttention", "statusUnknown"] },
];

/** "How to read this screen": the colours and every term, folded away until opened. */
export function HowToReadPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-muted/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm font-medium"
      >
        <span className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-primary" /> How to read this screen</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-5 border-t border-border px-4 py-4 text-sm">
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Colours</h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {COLOUR_LEGEND.map((c) => (
                <li key={c.colour} className="flex items-start gap-2">
                  <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", DOT[c.colour])} />
                  <span><span className="font-medium">{c.label}:</span> {c.means}</span>
                </li>
              ))}
            </ul>
          </div>
          {GROUPS.map((group) => (
            <div key={group.heading}>
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{group.heading}</h3>
              <dl className="mt-2 space-y-2">
                {group.terms.map((term) => {
                  const entry = NETWORK_HEALTH_HELP[term];
                  return (
                    <div key={term}>
                      <dt className="font-medium">{entry.title}</dt>
                      <dd className="text-muted-foreground">
                        {entry.means}
                        {"why" in entry && entry.why ? ` ${entry.why}` : ""}
                        {"todo" in entry && entry.todo ? <span className="text-foreground"> What to do: {entry.todo}</span> : null}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
