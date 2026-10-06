"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import type { InvestorOption } from "@/lib/types/investor";
import { cn } from "@/lib/utils";

export const INVESTOR_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const OTHER = "__other__";

function optionLabel(option: InvestorOption): string {
  const agreements = option.agreements.length > 0 ? ` · ${option.agreements.join(", ")}` : "";
  const used = option.usernames.length > 0 ? ` · used by ${option.usernames.join(", ")}` : "";
  return `${option.legalName} (${option.code})${agreements}${used}`;
}

/**
 * Chooses the investor behind a Network Partner account from the investor
 * register (Finance > Investors). Entering an id by hand stays possible, but the
 * backend only accepts an investor that is in the register.
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
        Investors are registered under Finance &gt; Investors. Register the investor there first if
        it is not in this list.
      </p>
    </div>
  );
}
