"use client";

import { Label } from "@/components/ui/label";
import { useCompanyScope } from "@/providers/CompanyScopeProvider";
import { cn } from "@/lib/utils";

/**
 * The company a new record belongs to, chosen in the form itself (never by asking for the top-bar
 * switcher first). Required: a role that reaches every company picks from the list, starting from
 * the switcher's company or, with none selected, the account's own; everyone else sees their own
 * company, read-only. The action sending the record makes that company the request's context, so
 * the API binds the request (and row security) to it.
 */
export function CompanyField({
  id,
  value,
  onChange,
  error,
  hint,
}: {
  id: string;
  /** Company code; "" = none chosen. */
  value: string;
  onChange: (code: string) => void;
  error?: string;
  hint?: string;
}) {
  const { isPlatformAdmin, companies, companyCode } = useCompanyScope();
  const current = companies.find((c) => c.code === value);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        Company<span className="ml-0.5 text-destructive">*</span>
      </Label>
      {isPlatformAdmin ? (
        <select
          id={id}
          value={value}
          required
          aria-required="true"
          aria-invalid={Boolean(error)}
          onChange={(e) => onChange(e.target.value)}
          className={cn("flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm", error && "border-destructive")}
        >
          <option value="">Choose the company…</option>
          {companies.map((c) => (
            <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
          ))}
        </select>
      ) : (
        <p id={id} className="flex h-9 items-center rounded-md border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
          {current ? `${current.name} (${current.code})` : value || companyCode || "Your company"}
        </p>
      )}
      {(error || hint) && <p className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>{error ?? hint}</p>}
    </div>
  );
}

/** The company a new record's form starts from: the switcher's, else the account's own. */
export function useDefaultCompany(): string {
  const { companyCode, homeCompanyCode } = useCompanyScope();
  return companyCode ?? homeCompanyCode ?? "";
}
