"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customRangeProblem, rangeDays } from "@/lib/analytics/filters";
import { dateRangeLabel } from "@/lib/analytics/format";

/**
 * One day or a range, at most 366 days and never past today. Leaving the end date empty
 * reports on the start date alone. The backend applies the same rules again.
 * Mounted only while open, so it always starts from the dates currently applied.
 */
export function CustomDatesDialog({
  onOpenChange,
  today,
  initialFrom,
  initialTo,
  onApply,
}: {
  onOpenChange: (open: boolean) => void;
  today: string;
  initialFrom?: string;
  initialTo?: string;
  onApply: (from: string, to: string | undefined) => void;
}) {
  const [from, setFrom] = useState(initialFrom ?? "");
  const [to, setTo] = useState(initialTo ?? "");

  const problem = customRangeProblem(from, to, today);
  const preview = problem
    ? problem
    : !to || to === from
      ? `Reporting on ${dateRangeLabel(from, from)}.`
      : `Reporting on ${dateRangeLabel(from, to)} (${rangeDays(from, to)} days).`;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Custom dates</DialogTitle>
          <DialogDescription>
            Track income for one day, or across a range. Leave the end date empty to report on the start date alone.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!problem) onApply(from, to || undefined);
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="analytics-from">
                From <span aria-hidden="true">*</span>
              </Label>
              <Input
                id="analytics-from"
                type="date"
                required
                max={today}
                value={from}
                onChange={(event) => {
                  const value = event.target.value;
                  setFrom(value);
                  // a new start date reports on that day until an end date is chosen
                  if (!to || to < value) setTo(value);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="analytics-to">To (optional)</Label>
              <Input
                id="analytics-to"
                type="date"
                min={from || undefined}
                max={today}
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>
          </div>
          <p role="status" className="text-xs text-muted-foreground">
            {preview}
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={problem !== null}>
              Apply
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
