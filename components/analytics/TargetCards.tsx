"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Target as TargetIcon } from "lucide-react";
import { toast } from "sonner";
import { setAnalyticsTarget } from "@/actions/analytics";
import { Amount } from "@/components/analytics/AmountsVisibility";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currencyLabel, formatCount, formatMoney } from "@/lib/analytics/format";
import type { AnalyticsTarget } from "@/lib/types/analytics";

const COPY = {
  REVENUE_COLLECTED: {
    title: "Revenue collected",
    dialogTitle: "Set the revenue collected target",
    field: "Revenue collected this month",
  },
  NEW_SUBSCRIBERS: {
    title: "New subscribers",
    dialogTitle: "Set the new subscribers target",
    field: "New subscribers this month",
  },
} as const;

function monthName(month: string): string {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** This month's two goals: what has been reached so far, the goal if one is set, and a way to set it. */
export function TargetCards({
  targets,
  scopeLabel,
  routerId,
}: {
  targets: AnalyticsTarget[];
  /** "every router" or the selected router's name */
  scopeLabel: string;
  routerId?: string;
}) {
  const [editing, setEditing] = useState<AnalyticsTarget | null>(null);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {targets.map((target) => {
        const money = target.metric === "REVENUE_COLLECTED";
        const show = (value: string) => (money ? <Amount value={value} currency={target.unit} /> : formatCount(Number(value)));
        const progress = target.progressPercent == null ? null : Number.parseFloat(target.progressPercent);
        return (
          <section key={target.metric} className="rounded-xl border border-border bg-card p-5">
            <header className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium text-foreground">{COPY[target.metric].title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {monthName(target.month)} · {scopeLabel}
                </p>
              </div>
              {target.editable && (
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(target)}>
                  <TargetIcon aria-hidden="true" />
                  {target.value == null ? "Set target" : "Change target"}
                </Button>
              )}
            </header>

            <p className="mt-4 text-2xl font-semibold tabular-nums text-foreground">
              {show(target.achieved)}
              {target.value != null && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">of {show(target.value)}</span>
              )}
            </p>

            {progress != null ? (
              <div className="mt-3">
                <div
                  role="progressbar"
                  aria-label={`${COPY[target.metric].title} progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(100, Math.round(progress))}
                  className="h-2 w-full overflow-hidden rounded-full bg-muted"
                >
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {progress.toLocaleString("en-US", { maximumFractionDigits: 1 })}% of this month&apos;s target
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                {target.value == null ? "No target for this month yet. " : ""}
                {target.editable && target.value == null && (
                  <button type="button" onClick={() => setEditing(target)} className="font-medium text-primary underline-offset-2 hover:underline">
                    Set a target
                  </button>
                )}
                {target.value == null && <> · previous 3 months averaged {show(target.suggestedValue)}.</>}
              </p>
            )}
          </section>
        );
      })}

      {editing && (
        <SetTargetDialog target={editing} scopeLabel={scopeLabel} routerId={routerId} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function SetTargetDialog({
  target,
  scopeLabel,
  routerId,
  onClose,
}: {
  target: AnalyticsTarget;
  scopeLabel: string;
  routerId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const money = target.metric === "REVENUE_COLLECTED";
  const [value, setValue] = useState(target.value == null ? "" : money ? target.value : String(Number(target.value)));
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const copy = COPY[target.metric];
  const suggestion = money ? target.suggestedValue : String(Number(target.suggestedValue));
  const valid = money ? /^\d+(\.\d{1,2})?$/.test(value.trim()) : /^\d+$/.test(value.trim());

  const save = () => {
    setError(null);
    startSaving(async () => {
      const result = await setAnalyticsTarget({ metric: target.metric, value: value.trim(), routerId });
      if (!result.success) {
        setError(result.message);
        return;
      }
      toast.success(`${copy.title} target saved`);
      onClose();
      router.refresh();
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.dialogTitle}</DialogTitle>
          <DialogDescription>
            This goal covers {monthName(target.month)} for {scopeLabel}. You can change it any time before the month ends.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (valid && !saving) save();
          }}
        >
          <Label htmlFor="analytics-target">
            {copy.field} <span aria-hidden="true">*</span>
          </Label>
          <div className="flex items-center gap-2">
            {money && <span className="text-sm text-muted-foreground">{currencyLabel(target.unit)}</span>}
            <Input
              id="analytics-target"
              inputMode={money ? "decimal" : "numeric"}
              required
              autoFocus
              value={value}
              onChange={(event) => setValue(event.target.value)}
              aria-invalid={value !== "" && !valid}
              aria-describedby="analytics-target-help"
            />
          </div>
          <p id="analytics-target-help" className="text-xs text-muted-foreground">
            {money ? "An amount of 0 or more." : "A whole number of 0 or more."}
          </p>
          <button
            type="button"
            onClick={() => setValue(suggestion)}
            className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            Use the 3-month average: {money ? formatMoney(target.suggestedValue, target.unit) : formatCount(Number(suggestion))}
          </button>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!valid || saving}>
              {saving ? "Saving…" : "Set target"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
