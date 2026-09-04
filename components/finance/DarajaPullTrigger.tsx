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

export function DarajaPullTrigger({ initialDate, initialEntries, initialSummary }: Props) {
  const [date, setDate] = useState(initialDate);
  const [entries, setEntries] = useState<DarajaReconciliationEntry[]>(initialEntries);
  const [summary, setSummary] = useState<ReconciliationOutcomeCounts>(initialSummary);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

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
    try {
      const res = await triggerDarajaPull({ targetDate: date });
      if (res.success && res.data) {
        const s: DarajaReconciliationSummary = res.data.summary;
        setResult({
          kind: "success",
          text:
            `Sweep complete for ${res.data.targetDate}: ${res.data.healedCount} healed, ` +
            `${s.matched} matched, ${s.unmatchedInIbs} unmatched in IBS, ` +
            `${s.ambiguous} ambiguous.`,
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
                max={todayEatIso()}
                onChange={(e) => {
                  const next = e.target.value || todayEatIso();
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

          {summaryChips(summary).length > 0 && (
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
        <CardContent className="overflow-x-auto">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No reconciliation entries for this date yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4 font-medium">Receipt</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 pr-4 font-medium">Outcome</th>
                  <th className="py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b">
                    <td className="py-2 pr-4 font-mono text-xs">{entry.receiptNo}</td>
                    <td className="py-2 pr-4">
                      {Number(entry.amount).toLocaleString("en-KE", {
                        style: "currency",
                        currency: "KES",
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge
                        variant={
                          entry.outcome === "MATCHED" || entry.outcome === "AUTO_HEALED"
                            ? "default"
                            : entry.outcome === "AMBIGUOUS"
                              ? "outline"
                              : "destructive"
                        }
                      >
                        {entry.outcome.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {entry.resolutionNotes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}