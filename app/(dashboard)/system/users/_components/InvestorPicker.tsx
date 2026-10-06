"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import type { InvestorOption } from "@/lib/types/investor";
import { cn } from "@/lib/utils";

export const INVESTOR_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const OTHER = "__other__";

function optionLabel(option: InvestorOption): string {
  const what = option.agreements.length > 0 ? option.agreements.join(", ") : "Router owner, no agreement";
  return `${what} · used by ${option.usernames.join(", ")}`;
}

/**
 * Chooses the investor party behind a Network Partner account. Known parties
 * are offered by name; any other is entered by its id, because the backend has
 * no endpoint that lists investor parties.
 */
export function InvestorPicker({
  value,
  onChange,
  options,
  invalid,
}: {
  value: string;
  onChange: (investorId: string) => void;
  options: InvestorOption[];
  invalid?: boolean;
}) {
  const known = options.some((o) => o.investorId === value);
  const [manual, setManual] = useState(options.length === 0 || (value !== "" && !known));

  return (
    <div className="space-y-2">
      {options.length > 0 && (
        <select
          aria-label="Investor record"
          value={manual ? OTHER : value}
          onChange={(e) => {
            const next = e.target.value;
            setManual(next === OTHER);
            onChange(next === OTHER ? "" : next);
          }}
          className={cn(
            "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            invalid && !manual ? "border-destructive" : "border-input"
          )}
        >
          <option value="">Select an investor…</option>
          {options.map((o) => (
            <option key={o.investorId} value={o.investorId}>
              {optionLabel(o)}
            </option>
          ))}
          <option value={OTHER}>Another investor (enter its ID)…</option>
        </select>
      )}
      {manual && (
        <Input
          aria-label="Investor ID"
          placeholder="Investor ID, e.g. 3f2b8c1e-…"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          className={cn("font-mono text-xs", invalid && "border-destructive")}
        />
      )}
      <p className="text-xs text-muted-foreground">
        The investor must already have an agreement or a router assigned. The ID is the investor
        id on that agreement or router.
      </p>
    </div>
  );
}
