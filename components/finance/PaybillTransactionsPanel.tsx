"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  assignPaybillTransaction,
  getPaybillTransactions,
  markPaybillTransactionHandled,
} from "@/actions/payments";
import type {
  PaybillOutcome,
  PaybillTransaction,
  PaybillTransactionFilters,
  PaybillTransactionPage,
} from "@/lib/types/payments";
import { addDaysToDateOnly, todayEatIso } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PAGE_SIZE = 50;

const OUTCOMES: { value: PaybillOutcome | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "NEEDS_REVIEW", label: "Needs review" },
  { value: "RENEWED", label: "Renewed" },
  { value: "RECORDED", label: "Already in IBS" },
  { value: "HANDLED", label: "Handled" },
  { value: "PLATFORM_FEE", label: "System fee" },
  { value: "NEW", label: "Waiting for prompt result" },
];

const OUTCOME_STYLE: Record<PaybillOutcome, string> = {
  NEEDS_REVIEW: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  NEW: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  RENEWED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  RECORDED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  HANDLED: "bg-muted text-muted-foreground",
  PLATFORM_FEE: "bg-muted text-muted-foreground",
};

const REASON_TEXT: Record<string, string> = {
  NO_ACCOUNT_NUMBER: "No account number typed",
  UNKNOWN_ACCOUNT: "No account with this number on this paybill",
  NO_PACKAGE: "The account has no package",
  UNDERPAID: "Less than the package price",
  FAILED: "Renewal failed; try assigning it",
  PROMPT_NOT_SETTLED: "Paid at Safaricom, but IBS has no record of this prompt: the customer may not have been connected",
};

function outcomeLabel(outcome: PaybillOutcome): string {
  return OUTCOMES.find((o) => o.value === outcome)?.label ?? outcome;
}

function formatWhen(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatAmount(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return `KSh ${Number(value).toLocaleString("en-KE")}`;
}

interface Props {
  /** A receipt to open on (from the universal search). */
  initialQuery?: string;
  /** Whether the caller may assign / close lines (the backend still checks). */
  canChange: boolean;
}

/**
 * Every paybill payment C2B or the Daraja Pull has seen (kept 90 days), filterable, with the
 * two actions for a payment that needs review: give it to an account, or mark it handled.
 */
export function PaybillTransactionsPanel({ initialQuery = "", canChange }: Props) {
  const today = todayEatIso();
  const [from, setFrom] = useState(initialQuery ? addDaysToDateOnly(today, -89) : addDaysToDateOnly(today, -6));
  const [to, setTo] = useState(today);
  const [shortCode, setShortCode] = useState("");
  const [outcome, setOutcome] = useState<PaybillOutcome | "">("");
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PaybillTransactionPage | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [action, setAction] = useState<{ kind: "assign" | "handled"; line: PaybillTransaction } | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async (filters: PaybillTransactionFilters) => {
    const id = ++requestId.current;
    setLoading(true);
    const res = await getPaybillTransactions({ ...filters, size: PAGE_SIZE });
    if (id !== requestId.current) return; // a newer search is on its way
    setData(res.data);
    setMessage(res.message);
    setLoading(false);
  }, []);

  // Filters apply at once; the search box waits for the typing to pause.
  useEffect(() => {
    const timer = setTimeout(() => {
      void load({ from, to, shortCode, outcome, q: query, page });
    }, query ? 350 : 0);
    return () => clearTimeout(timer);
  }, [from, to, shortCode, outcome, query, page, load]);

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setPage(0);
      setter(value);
    };
  }

  async function afterAction(result: { success: boolean; message: string }) {
    setNotice({ kind: result.success ? "success" : "error", text: result.message });
    if (result.success) {
      setAction(null);
      await load({ from, to, shortCode, outcome, q: query, page });
    }
    return result;
  }

  const counts = data?.counts ?? {};
  const allCount = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <Card id="paybill-payments">
      <CardHeader>
        <CardTitle className="text-base">Paybill payments</CardTitle>
        <p className="text-xs text-muted-foreground">
          Every payment made to a paybill, from Safaricom&apos;s live notification (C2B) and the hourly
          statement (Pull). Search by receipt, account number or the payer&apos;s phone. Kept 90 days.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="space-y-1">
            <label htmlFor="paybill-q" className="text-xs text-muted-foreground">
              Receipt, account number or phone
            </label>
            <Input
              id="paybill-q"
              value={query}
              placeholder="TKF1AB2CD3, BDK0069 or 0712 345 678"
              onChange={(e) => resetPage(setQuery)(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="paybill-from" className="text-xs text-muted-foreground">From</label>
            <Input id="paybill-from" type="date" value={from} max={to}
                   onChange={(e) => resetPage(setFrom)(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label htmlFor="paybill-to" className="text-xs text-muted-foreground">To</label>
            <Input id="paybill-to" type="date" value={to} min={from} max={today}
                   onChange={(e) => resetPage(setTo)(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label htmlFor="paybill-code" className="text-xs text-muted-foreground">Paybill</label>
            <select
              id="paybill-code"
              value={shortCode}
              onChange={(e) => resetPage(setShortCode)(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">All paybills</option>
              {(data?.shortCodes ?? []).map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by outcome">
          {OUTCOMES.map((o) => {
            const count = o.value === "" ? allCount : counts[o.value] ?? 0;
            if (o.value !== "" && o.value !== "NEEDS_REVIEW" && count === 0) return null;
            const active = outcome === o.value;
            return (
              <button
                key={o.value || "all"}
                type="button"
                onClick={() => resetPage(setOutcome)(o.value)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1 text-xs tabular-nums transition-colors ${
                  active ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"
                }`}
              >
                {o.label} · {count}
              </button>
            );
          })}
        </div>

        {notice && (
          <div
            role="status"
            className={`rounded-md border p-3 text-sm ${
              notice.kind === "success"
                ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                : "border-destructive/40 text-destructive"
            }`}
          >
            {notice.text}
          </div>
        )}
        {message && (
          <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">{message}</div>
        )}

        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-normal">Paid</th>
                <th className="px-3 py-2 font-normal">Receipt</th>
                <th className="px-3 py-2 font-normal text-right">Amount</th>
                <th className="px-3 py-2 font-normal">Account no.</th>
                <th className="px-3 py-2 font-normal">Payer</th>
                <th className="px-3 py-2 font-normal">Paybill</th>
                <th className="px-3 py-2 font-normal">Outcome</th>
                <th className="px-3 py-2 font-normal" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((line) => {
                const open = line.outcome === "NEEDS_REVIEW" || line.outcome === "NEW";
                const highlighted = initialQuery && line.receiptNo.toUpperCase() === initialQuery.toUpperCase();
                return (
                  <tr key={line.id} className={`border-t border-border align-top ${highlighted ? "bg-amber-500/10" : ""}`}>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">{formatWhen(line.paidAt ?? line.createdAt)}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {line.receiptNo}
                      <div className="font-sans text-[11px] text-muted-foreground">
                        {[line.viaC2b && "C2B", line.viaPull && "Pull"].filter(Boolean).join(" + ")}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatAmount(line.amount)}</td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs">{line.accountNumber ?? line.billRef ?? "—"}</span>
                      {line.billRef && line.accountNumber && line.billRef.toUpperCase() !== line.accountNumber && (
                        <div className="text-[11px] text-muted-foreground">typed &ldquo;{line.billRef}&rdquo;</div>
                      )}
                      {line.customerName && (
                        <div className="text-[11px]">
                          {line.customerIdxno ? (
                            <Link href={`/customers/${line.customerIdxno}`} className="underline-offset-2 hover:underline">
                              {line.customerName}
                            </Link>
                          ) : line.customerName}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className="tabular-nums">{line.payer ?? "—"}</span>
                      {line.firstName && <div className="text-[11px] text-muted-foreground">{line.firstName}</div>}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {line.shortCode ?? "—"}
                      <div className="text-[11px] text-muted-foreground">{line.companyCode ?? "No company yet"}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${OUTCOME_STYLE[line.outcome]}`}>
                        {outcomeLabel(line.outcome)}
                      </span>
                      {line.outcomeReason && open && (
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {REASON_TEXT[line.outcomeReason] ?? line.outcomeReason}
                        </div>
                      )}
                      {line.handledBy && (
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {line.handledBy}{line.note ? `: ${line.note}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      {open && canChange && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setNotice(null); setAction({ kind: "assign", line }); }}>
                            Assign
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setNotice(null); setAction({ kind: "handled", line }); }}>
                            Handled
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {data && data.items.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No paybill payments match these filters.
                  </td>
                </tr>
              )}
              {!data && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted-foreground">Loading…</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="tabular-nums">
            {data ? `${data.total.toLocaleString("en-KE")} payment${data.total === 1 ? "" : "s"}` : ""}
            {loading && data ? " · updating…" : ""}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="tabular-nums">{page + 1} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>

      {action && (
      <LineActionDialog
        key={`${action.kind}-${action.line.id}`}
        action={action}
        onClose={() => setAction(null)}
        onAssign={async (line, accountNumber, note) => afterAction(await assignPaybillTransaction(line.id, accountNumber, note))}
        onHandled={async (line, note) => afterAction(await markPaybillTransactionHandled(line.id, note))}
      />
      )}
    </Card>
  );
}

interface DialogProps {
  action: { kind: "assign" | "handled"; line: PaybillTransaction };
  onClose: () => void;
  onAssign: (line: PaybillTransaction, accountNumber: string, note: string) => Promise<{ success: boolean; message: string }>;
  onHandled: (line: PaybillTransaction, note: string) => Promise<{ success: boolean; message: string }>;
}

function LineActionDialog({ action, onClose, onAssign, onHandled }: DialogProps) {
  // keyed by the line, so each opening starts fresh
  const [accountNumber, setAccountNumber] = useState(action.line.accountNumber ?? action.line.billRef ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { kind, line } = action;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = kind === "assign" ? await onAssign(line, accountNumber, note) : await onHandled(line, note);
    setBusy(false);
    if (!result.success) setError(result.message);
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{kind === "assign" ? "Give this payment to an account" : "Mark this payment handled"}</DialogTitle>
            <DialogDescription>
              {line.receiptNo} · {formatAmount(line.amount)} to paybill {line.shortCode ?? "—"}
              {line.billRef ? `, typed “${line.billRef}”` : ", no account number typed"}.
            </DialogDescription>
          </DialogHeader>
          {kind === "assign" ? (
            <>
              <div className="space-y-1">
                <label htmlFor="assign-account" className="text-xs text-muted-foreground">Account number</label>
                <Input id="assign-account" value={accountNumber} autoFocus placeholder="BDK0069"
                       onChange={(e) => setAccountNumber(e.target.value)} />
                <p className="text-[11px] text-muted-foreground">
                  The account is renewed exactly as if the customer had typed this number: booked, reconnected
                  and sent a confirmation text.
                </p>
              </div>
              <div className="space-y-1">
                <label htmlFor="assign-note" className="text-xs text-muted-foreground">Note (optional)</label>
                <Input id="assign-note" value={note} onChange={(e) => setNote(e.target.value)}
                       placeholder="Customer called, typed the house number" />
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <label htmlFor="handled-note" className="text-xs text-muted-foreground">What was done</label>
              <Input id="handled-note" value={note} autoFocus onChange={(e) => setNote(e.target.value)}
                     placeholder="Refunded / recorded as a manual payment / not ours" />
            </div>
          )}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={busy || (kind === "assign" ? !accountNumber.trim() : !note.trim())}>
              {busy ? "Saving…" : kind === "assign" ? "Assign and renew" : "Mark handled"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
