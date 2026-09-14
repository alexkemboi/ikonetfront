"use client";

import React, { useState } from "react";
import {
  triggerDarajaPull,
  getDarajaReconciliation,
} from "@/actions/payments";
import type {
  DarajaReconciliationEntry,
  DarajaReconciliationSummary,
  ReconciliationOutcomeCounts,
} from "@/lib/types/payments";
import { todayEatIso } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ReconciliationView } from "@/components/finance/ReconciliationView";

interface Props {
  initialDate: string;
  initialEntries: DarajaReconciliationEntry[];
  initialSummary: ReconciliationOutcomeCounts;
}

function summaryChips(summary: ReconciliationOutcomeCounts): { label: string; value: number }[] {
  return Object.entries(summary)
    .sort((a, b) => b[1] - a[1])
    .map(([outcome, count]) => ({ label: outcome.replace(/_/g, " "), value: count }));
}

interface StatusCell {
  label: string;
  value: number;
  valueClass: string;
  sub: string;
  subClass: string;
}

/** The six operational metrics surfaced after a successful sweep. */
function statusCells(s: DarajaReconciliationSummary): StatusCell[] {
  return [
    {
      label: "Matched",
      value: s.matched,
      valueClass: "text-foreground",
      sub: "Verified in both",
      subClass: "text-muted-foreground",
    },
    {
      label: "Auto-Healed",
      value: s.autoHealedCount,
      valueClass: "text-emerald-600",
      sub: "Recovered callbacks",
      subClass: "text-emerald-600",
    },
    {
      label: "Total Daraja",
      value: s.totalDaraja,
      valueClass: "text-foreground",
      sub: "Safaricom pull",
      subClass: "text-muted-foreground",
    },
    {
      label: "Total In IBS",
      value: s.totalIbs,
      valueClass: "text-foreground",
      sub: "Live webhook payments",
      subClass: "text-muted-foreground",
    },
    {
      label: "Unmatched in Daraja",
      value: s.unmatchedInDaraja,
      valueClass: "text-amber-600",
      sub: "IBS-only (pending pull)",
      subClass: "text-muted-foreground",
    },
    {
      label: "Unmatched in IBS",
      value: s.unmatchedInIbs,
      valueClass: "text-destructive",
      sub: "Needs manual audit",
      subClass: "text-muted-foreground",
    },
  ];
}

export function DarajaPullTrigger({ initialDate, initialEntries, initialSummary }: Props) {
  // Strict date ceiling: the backend tolerates past days only, and the
  // Africa/Nairobi "today" must not drift from the reconciliation day.
  const todayIso = todayEatIso();

  const [date, setDate] = useState(initialDate || todayIso);
  const [entries, setEntries] = useState<DarajaReconciliationEntry[]>(initialEntries);
  const [summary, setSummary] = useState<ReconciliationOutcomeCounts>(initialSummary);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [sweep, setSweep] = useState<DarajaReconciliationSummary | null>(null);

  async function refresh(dateValue: string) {
    const { entries: nextEntries, summary: nextSummary, message } =
      await getDarajaReconciliation(dateValue);
    setEntries(nextEntries);
    setSummary(nextSummary);
    if (message && !result) {
      setResult({ kind: "error", text: message });
    }
  }

  async function handleRun() {
    setRunning(true);
    setResult(null);
    setSweep(null);
    try {
      const res = await triggerDarajaPull({ targetDate: date });
      if (res.success && res.data) {
        const s: DarajaReconciliationSummary = res.data;
        setSweep(s);
        setResult({
          kind: "success",
          text:
            `Sweep complete for ${s.day}: ${s.autoHealedCount} auto-healed, ` +
            `${s.matched} matched, ${s.totalIbs} total in IBS, ` +
            `${s.unmatchedInDaraja} unmatched in Daraja, ${s.unmatchedInIbs} unmatched in IBS.`,
        });
      } else {
        setResult({ kind: "error", text: res.message });
      }
      await refresh(date);
    } catch (error) {
      console.error("[DarajaPullTrigger] run error:", error);
      setResult({ kind: "error", text: "Unexpected error running the sweep." });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daraja PullTransactions sweep</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1">
              <label
                htmlFor="recon-date"
                className="text-xs font-medium text-muted-foreground"
              >
                Target date
              </label>
              <Input
                id="recon-date"
                type="date"
                value={date}
                max={todayIso}
                onChange={(e) => {
                  const next = e.target.value || todayIso;
                  setDate(next);
                  void refresh(next);
                }}
                className="w-full sm:w-56"
              />
            </div>
            <Button
              onClick={handleRun}
              disabled={running}
              className="bg-amber-500 text-black hover:bg-amber-400"
            >
              {running ? "Running…" : "Run sweep"}
            </Button>
          </div>

          {result && (
            <p
              className={
                result.kind === "success"
                  ? "text-sm text-emerald-600 dark:text-emerald-400"
                  : "text-sm text-destructive"
              }
            >
              {result.text}
            </p>
          )}

          {/* Operational status card — exact counts from the last sweep */}
          {sweep && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Sweep summary for{" "}
                  <span className="font-sans tabular-nums text-foreground">{sweep.day}</span>
                </span>
                <Badge className="bg-emerald-600 text-white">
                  {running ? "Sweeping…" : "Sweep completed"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {statusCells(sweep).map((cell) => (
                  <div
                    key={cell.label}
                    className="rounded-lg border border-border bg-muted/40 p-3"
                  >
                    <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {cell.label}
                    </div>
                    <div className={`mt-1 text-xl font-bold ${cell.valueClass}`}>
                      {cell.value.toLocaleString("en-KE")}
                    </div>
                    <div className={`mt-0.5 text-[10px] ${cell.subClass}`}>{cell.sub}</div>
                  </div>
                ))}
              </div>

              {/* Advisory: live webhook payments that Pull has not yet confirmed */}
              {sweep.totalDaraja === 0 && sweep.totalIbs > 0 && (
                <div className="mt-4 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/10 p-3.5 text-xs leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-amber-600">
                    Note on {sweep.unmatchedInDaraja} unmatched-in-Daraja payment
                    {sweep.unmatchedInDaraja === 1 ? "" : "s"}:
                  </span>{" "}
                  These payments succeeded in real-time via live webhook callbacks.
                  If Safaricom Pull returns 0 items, confirm the shortcode has
                  completed the one-time{" "}
                  <code className="rounded bg-muted px-1 font-mono text-[10px] text-foreground">
                    /pulltransactions/v1/register
                  </code>{" "}
                  call with Safaricom; until then every settled payment in the window
                  will be listed as unmatched in Daraja.
                </div>
              )}
            </div>
          )}

          {!sweep && summaryChips(summary).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {summaryChips(summary).map((chip) => (
                <Badge key={chip.label} variant="secondary">
                  {chip.label}: {chip.value}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Day entries</CardTitle>
        </CardHeader>
        <CardContent>
          <ReconciliationView
            entries={entries}
            date={date}
            onRefresh={() => refresh(date)}
          />
        </CardContent>
      </Card>
    </div>
  );
}