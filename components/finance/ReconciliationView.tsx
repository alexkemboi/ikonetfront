"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { forcePostReconcile } from "@/actions/payments";
import type { DarajaReconciliationEntry } from "@/lib/types/payments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
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

  const columns: ColumnDef<DarajaReconciliationEntry>[] = [
    {
      accessorKey: "transactionDate",
      header: "Paid at",
      cell: ({ row }) => (
        <span className="font-sans tabular-nums text-xs text-muted-foreground">
          {formatPaidAt(row.original.transactionDate)}
        </span>
      ),
    },
    {
      accessorKey: "receiptNumber",
      header: "Receipt",
      cell: ({ row }) => (
        <span className="font-sans tabular-nums text-xs font-semibold text-foreground">
          {row.original.receiptNumber}
          {row.original.serviceType ? (
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {row.original.serviceType}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone number",
      cell: ({ row }) => (
        <span className="font-sans tabular-nums text-xs text-foreground">
          {row.original.phoneNumber || "—"}
        </span>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Subscriber / Service",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.customerName || "—"}</span>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="tabular-nums text-foreground">
          {Number(row.original.amount).toLocaleString("en-KE", {
            style: "currency",
            currency: "KES",
            maximumFractionDigits: 0,
          })}
        </span>
      ),
    },
    {
      accessorKey: "outcome",
      header: "Outcome",
      cell: ({ row }) => outcomeBadge(row.original.outcome),
    },
    {
      id: "auditAction",
      header: "Audit context & action",
      cell: ({ row }) => {
        const entry = row.original;
        return (
          <div className="text-muted-foreground">
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
          </div>
        );
      },
    },
  ];

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
      <div>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reconciliation entries for this date yet.
          </p>
        ) : (
          <DataTable columns={columns} data={entries} searchPlaceholder="Search receipt, phone, subscriber…" />
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
              <span className="font-sans tabular-nums font-semibold text-amber-500">
                {formatKsh(forceTarget.amount)}
              </span>{" "}
              for receipt{" "}
              <span className="font-sans tabular-nums font-semibold">{forceTarget.receiptNumber}</span>{" "}
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