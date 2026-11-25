"use client";

import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { getOrganisationOptions } from "@/actions/usersAccess";
import type { CompanySummary } from "@/actions/companies";
import type { OrganisationOptions } from "@/lib/types/usersAccess";
import { cn } from "@/lib/utils";

/**
 * The tenant (company) a new account or invitation belongs to. Shown to roles that reach every
 * company; everyone else creates in their own company and sees it read-only. The form sends both
 * the company code and its tenant id, and the API checks they name the same organisation.
 */
export function TenantCompanyField({
  id,
  companies,
  canChoose,
  value,
  onChange,
  onOptions,
  initialOptions,
  error,
}: {
  id: string;
  companies: CompanySummary[];
  canChoose: boolean;
  /** Company code; "" = none chosen yet. */
  value: string;
  onChange: (code: string) => void;
  /** The chosen company's locations and stations (null while loading or with none chosen). */
  onOptions: (options: OrganisationOptions | null) => void;
  /** Options already loaded for the company in scope, reused while it stays chosen. */
  initialOptions?: { code: string | null; options: OrganisationOptions | null };
  error?: string;
}) {
  const [loading, setLoading] = useState(false);
  const request = useRef(0);

  useEffect(() => {
    if (!value) {
      onOptions(null);
      return;
    }
    if (initialOptions && initialOptions.code === value) {
      onOptions(initialOptions.options);
      return;
    }
    const id = ++request.current;
    setLoading(true);
    onOptions(null);
    getOrganisationOptions(value)
      .then((res) => {
        if (id === request.current) onOptions(res.success ? res.data : null);
      })
      .finally(() => {
        if (id === request.current) setLoading(false);
      });
    // onOptions is a state setter from the parent form
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const current = companies.find((c) => c.code === value);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        Tenant / company<span className="ml-0.5 text-destructive">*</span>
      </Label>
      {canChoose ? (
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          className={cn("flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm", error && "border-destructive")}
        >
          <option value="">Choose the organisation…</option>
          {companies.map((c) => (
            <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
          ))}
        </select>
      ) : (
        <p id={id} className="flex h-9 items-center rounded-md border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
          {current ? `${current.name} (${current.code})` : value || "Your organisation"}
        </p>
      )}
      <p className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>
        {error ?? (loading ? "Loading this organisation's locations and stations…"
          : "The account belongs to this organisation only; its data stays isolated to it.")}
      </p>
    </div>
  );
}

/** The tenant id of a company code, sent with it so the API can check both name the same organisation. */
export function tenantIdOf(companies: CompanySummary[], code: string | null | undefined): string | undefined {
  return code ? companies.find((c) => c.code === code)?.id : undefined;
}
