"use client";

import React, { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, RotateCcw, BookCheck, Search } from "lucide-react";
import { toast } from "sonner";
import { getReconciliationDay, postPaymentToLedgerAction } from "@/actions/payments";
import { compensateHotspotPayment } from "@/actions/vouchers";
import type {
  ReconciliationAttentionItem,
  ReconciliationDay,
  SafaricomCheckStatus,
} from "@/lib/types/payments";
import { Button } from "@/components/ui/button";

interface Props {
  initialDate: string;
  initialData: ReconciliationDay | null;
  initialMessage?: string;
}

const KIND_LABEL: Record<ReconciliationAttentionItem["kind"], string> = {
  PAID_NOT_CONNECTED: "Paid, not connected",
  LEDGER_NOT_POSTED: "Money not in the books",
  CHARGED_NOT_RECORDED: "Charged, no payment matched",
};

const CHECK_STYLE: Record<SafaricomCheckStatus, { title: string; className: string }> = {
  CONFIRMED: { title: "Safaricom confirms these payments", className: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" },
  UNAVAILABLE: { title: "Safaricom cross-check not available", className: "border-border bg-muted/40 text-muted-foreground" },
  DIFFERENCES: { title: "Safaricom reports charges we can't match", className: "border-rose-500/30 bg-rose-500/5 text-rose-400" },
  NOT_RUN: { title: "Safaricom cross-check not run for this day", className: "border-border bg-muted/40 text-muted-foreground" },
};

/** 254725134318 → 0725 134 318 */
function formatPhone(phone?: string | null): string {
  if (!phone) return "Unknown payer";
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("254") && digits.length === 12 ? `0${digits.slice(3)}` : digits;
  return local.length === 10 ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}` : phone;
}

function formatTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Africa/Nairobi" });
}

function ksh(value?: string | null): string {
  const n = Number(value ?? 0);
  return `Ksh ${Number.isFinite(n) ? n.toLocaleString() : value}`;
}

function storySentence(day: ReconciliationDay): string {
  const s = day.story;
  if (s.payments === 0 && day.attention.length === 0) return "No M-Pesa payments on this day.";
  const parts = [
    `${ksh(s.received)} from ${s.customers} customer${s.customers === 1 ? "" : "s"}`,
    `${s.connected} of ${s.payments} purchase${s.payments === 1 ? "" : "s"} connected`,
  ];
  if (s.connecting) parts.push(`${s.connecting} still connecting`);
  if (s.compensated) parts.push(`${s.compensated} compensated`);
  parts.push(
    s.needsAttention === 0 ? "nothing needs attention" : `${s.needsAttention} need${s.needsAttention === 1 ? "s" : ""} attention`
  );
  return parts.join(" · ") + ".";
}

export function ReconciliationDayView({ initialDate, initialData, initialMessage }: Props) {
  const [date, setDate] = useState(initialDate);
  const [day, setDay] = useState<ReconciliationDay | null>(initialData);
  const [message, setMessage] = useState<string | undefined>(initialMessage);
  const [loading, startLoading] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [issued, setIssued] = useState<Record<string, string>>({});

  function load(target: string) {
    startLoading(async () => {
      const res = await getReconciliationDay(target);
      setDay(res.data);
      setMessage(res.message);
    });
  }

  async function act(item: ReconciliationAttentionItem, key: string) {
    setBusyKey(key);
    try {
      if (item.action === "ISSUE_VOUCHER" && item.mpesaReceipt) {
        const res = await compensateHotspotPayment(item.mpesaReceipt, "Paid, never connected (Reconciliation)");
        if (res.success && res.voucherCode) {
          setIssued((prev) => ({ ...prev, [key]: res.voucherCode as string }));
          toast.success(`Voucher ${res.voucherCode} issued — give it to ${formatPhone(item.phone)}.`);
        } else {
          toast.error(res.message);
        }
      } else if (item.action === "POST_TO_LEDGER" && item.paymentId) {
        const res = await postPaymentToLedgerAction(item.paymentId);
        if (res.success) {
          toast.success(res.message);
          load(date);
        } else {
          toast.error(res.message);
        }
      }
    } finally {
      setBusyKey(null);
    }
  }

  const check = day?.safaricomCheck;
  const checkStyle = check ? CHECK_STYLE[check.status] : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
            The day in one line
          </span>
          <p className="mt-1 text-lg text-foreground">
            {loading ? "Loading…" : day ? storySentence(day) : message ?? "Reconciliation is unavailable."}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Day
          <input
            type="date"
            value={date}
            max={initialDate}
            onChange={(e) => {
              setDate(e.target.value);
              if (e.target.value) load(e.target.value);
            }}
            className="h-9 rounded-lg border border-border bg-muted px-3 text-xs text-foreground"
          />
        </label>
      </div>

      {day && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "MONEY IN", value: ksh(day.story.received), foot: `${day.story.payments} M-Pesa payments` },
            { label: "CUSTOMERS", value: day.story.customers.toLocaleString(), foot: "distinct payers" },
            { label: "CONNECTED", value: `${day.story.connected} / ${day.story.payments}`, foot: "purchases that went online" },
            {
              label: "NEEDS ATTENTION",
              value: day.story.needsAttention.toLocaleString(),
              foot: day.story.needsAttention ? "listed below" : "all clear",
              alert: day.story.needsAttention > 0,
            },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-border bg-card p-5 shadow-lg">
              <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
                {card.label}
              </span>
              <div className={`mt-2 text-2xl font-sans tabular-nums font-bold ${card.alert ? "text-rose-400" : "text-foreground"}`}>
                {card.value}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{card.foot}</p>
            </div>
          ))}
        </div>
      )}

      {day && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
          <div className="flex items-center gap-2">
            {day.attention.length ? (
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            )}
            <h2 className="text-sm font-semibold text-foreground">Needs attention</h2>
          </div>
          {day.attention.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Nothing to do: every payment that day was booked, and every paying customer got connected.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {day.attention.map((item, idx) => {
                const key = `${item.kind}-${item.paymentId ?? item.checkoutRequestId ?? item.mpesaReceipt ?? idx}`;
                const voucher = issued[key];
                return (
                  <li key={key} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-400">
                          {KIND_LABEL[item.kind]}
                        </span>
                        <span className="font-medium text-foreground">{formatPhone(item.phone)}</span>
                        {item.amount && <span className="text-muted-foreground">{ksh(item.amount)}</span>}
                        {item.occurredAt && <span className="text-muted-foreground">{formatTime(item.occurredAt)}</span>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.reason}
                        {item.mpesaReceipt ? ` · M-Pesa ${item.mpesaReceipt}` : ""}
                        {item.packageName ? ` · ${item.packageName}` : ""}
                        {item.routerName ? ` · ${item.routerName}` : ""}
                        {!item.mpesaReceipt && item.checkoutRequestId ? ` · checkout ${item.checkoutRequestId}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {voucher ? (
                        <span className="rounded-lg border border-border bg-muted px-3 py-1.5 font-mono text-sm tracking-widest">
                          {voucher}
                        </span>
                      ) : item.action === "ISSUE_VOUCHER" ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={busyKey === key}
                          onClick={() => act(item, key)}
                        >
                          {busyKey === key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                          Issue voucher
                        </Button>
                      ) : item.action === "POST_TO_LEDGER" ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={busyKey === key}
                          onClick={() => act(item, key)}
                        >
                          {busyKey === key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookCheck className="h-3.5 w-3.5" />}
                          Post to ledger
                        </Button>
                      ) : item.action === "ASSIGN_COMPANY" ? (
                        <span className="text-xs text-muted-foreground">Set the payment&apos;s company first</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Search className="h-3.5 w-3.5" /> Investigate with Safaricom
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {check && checkStyle && (
        <div className={`flex gap-3 rounded-2xl border p-4 text-sm ${checkStyle.className}`}>
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">{checkStyle.title}</p>
            <p className="mt-1 text-xs opacity-90">{check.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
