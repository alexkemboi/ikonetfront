"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { forcePostReconcile } from "@/actions/payments";
import type { DarajaReconciliationEntry } from "@/lib/types/payments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  entries: DarajaReconciliationEntry[];
  date: string;
  /** Re-fetch the day's entries + summary chips after a force-post. */
  onRefresh: () => Promise<void>;
}

function formatKsh(n: number): string {
  return Number(n).toLocaleString("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  });
}

function formatPaidAt(value: string | null | undefined): string {
  if (!value) return "—";
  const at = new Date(value);
  if (isNaN(at.getTime())) return value;
  return at.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function outcomeBadge(outcome: DarajaReconciliationEntry["outcome"]) {
  switch (outcome) {
    case "MATCHED":
      return (
        <Badge className="bg-emerald-600 text-white">
          <CheckCircle2 className="h-3 w-3" /> Matched
        </Badge>
      );
    case "AUTO_HEALED":
      return (
        <Badge className="bg-emerald-600 text-white">
          <RefreshCw className="h-3 w-3" /> Auto healed
        </Badge>
      );
    case "UNMATCHED_IN_DARAJA":
      return (
        <Badge variant="outline" className="text-amber-600">
          <ShieldAlert className="h-3 w-3" /> Unmatched in Daraja
        </Badge>
      );
    case "AMBIGUOUS":
      return (
        <Badge variant="destructive">
          <ShieldAlert className="h-3 w-3" /> Ambiguous
        </Badge>
      );
    case "UNMATCHED_IN_IBS":
    default:
      return (
        <Badge variant="destructive">
          <ShieldAlert className="h-3 w-3" /> Unmatched in IBS
        </Badge>
      );
  }
}

export function ReconciliationView({ entries, date, onRefresh }: Props) {
  const [forceTarget, setForceTarget] = useState<DarajaReconciliationEntry | null>(null);
  const [forceBusy, setForceBusy] = useState(false);
  const [forceError, setForceError] = useState<string | null>(null);

  async function handleForcePost() {
    if (!forceTarget) return;
    setForceBusy(true);
    setForceError(null);
    try {
      const res = await forcePostReconcile(forceTarget.receiptNumber, date);
      if (!res.success) {
        setForceError(res.message);
        return;
      }
      setForceTarget(null);
      await onRefresh();
    } finally {
      setForceBusy(false);
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reconciliation entries for this date yet.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b text-muted-foreground">
              <tr>
                <th className="py-2 pr-4 font-medium">Paid at</th>
                <th className="py-2 pr-4 font-medium">Receipt</th>
                <th className="py-2 pr-4 font-medium">Phone number</th>
                <th className="py-2 pr-4 font-medium">Subscriber / Service</th>
                <th className="py-2 pr-4 font-medium">Amount</th>
                <th className="py-2 pr-4 font-medium">Outcome</th>
                <th className="py-2 pr-4 font-medium">Audit context &amp; action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.receiptNumber} className="border-b align-top">
                  <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                    {formatPaidAt(entry.transactionDate)}
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs font-semibold text-foreground">
                    {entry.receiptNumber}
                    {entry.serviceType ? (
                      <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {entry.serviceType}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">
                    {entry.phoneNumber || "—"}
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {entry.customerName || "—"}
                  </td>
                  <td className="py-2 pr-4 tabular-nums text-foreground">
                    {Number(entry.amount).toLocaleString("en-KE", {
                      style: "currency",
                      currency: "KES",
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="py-2 pr-4">{outcomeBadge(entry.outcome)}</td>
                  <td className="py-2 text-muted-foreground">
                    <span className="block max-w-[280px] text-xs leading-snug">
                      {entry.notes || "—"}
                    </span>
                    {entry.canForceReconcile && (
                      <button
                        onClick={() => {
                          setForceError(null);
                          setForceTarget(entry);
                        }}
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 transition hover:text-amber-400"
                      >
                        Force Post to GL (Account 1110) →
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={forceTarget !== null} onOpenChange={(o) => !o && setForceTarget(null)}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Force post to general ledger</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This writes a verified M-Pesa receipt into Account 1110 and its
              revenue leg. It is idempotent — re-posting is a safe no-op.
            </DialogDescription>
          </DialogHeader>
          {forceError && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {forceError}
            </p>
          )}
          {forceTarget && (
            <p className="text-sm text-foreground">
              Post{" "}
              <span className="font-mono font-semibold text-amber-500">
                {formatKsh(forceTarget.amount)}
              </span>{" "}
              for receipt{" "}
              <span className="font-mono font-semibold">{forceTarget.receiptNumber}</span>{" "}
              to the general ledger?
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForceTarget(null)} disabled={forceBusy}>
              Cancel
            </Button>
            <Button
              onClick={handleForcePost}
              disabled={forceBusy}
              className="bg-amber-500 text-black hover:bg-amber-400"
            >
              {forceBusy ? "Posting…" : "Post to GL"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReconciliationLegend />
    </>
  );
}

/** The four-outcome "Audit & Action Guide" legend, collapsed by default. */
export function ReconciliationLegend() {
  const [open, setOpen] = useState(false);
  const cards: {
    key: string;
    title: string;
    icon: React.ElementType;
    iconClass: string;
    text: string;
  }[] = [
    {
      key: "matched",
      title: "Matched",
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
      text: "M-Pesa webhook callback received and confirmed against Daraja Pull records. Action: None required. GL and Account 1110 are balanced.",
    },
    {
      key: "auto-healed",
      title: "Auto healed",
      icon: RefreshCw,
      iconClass: "text-emerald-600",
      text: "Initial Safaricom webhook dropped (network glitch), scheduled Daraja pull sweep recovered it. Action: Account provisioned retroactively.",
    },
    {
      key: "unmatched-daraja",
      title: "Unmatched in Daraja",
      icon: ShieldAlert,
      iconClass: "text-amber-600",
      text: "IBS received a valid M-Pesa callback, but Daraja Pull API hasn't indexed it yet (settlement lag). Action: if the customer has a confirmed M-Pesa SMS, click Force Post to GL.",
    },
    {
      key: "unmatched-ibs",
      title: "Unmatched in IBS",
      icon: ShieldAlert,
      iconClass: "text-destructive",
      text: "Money hit the Paybill/Till but no matching checkout order exists in IBS. Action: verify the payer's phone number and manually assign an active package/customer account.",
    },
  ];

  return (
    <div className="mt-4 rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-xs font-semibold text-muted-foreground transition hover:text-foreground"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          Audit &amp; Action Guide
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      {open && (
        <div className="grid grid-cols-1 gap-3 border-t border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div key={card.key} className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex items-center gap-2">
                <card.icon className={`h-4 w-4 ${card.iconClass}`} />
                <span className="text-xs font-semibold text-foreground">{card.title}</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                {card.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}