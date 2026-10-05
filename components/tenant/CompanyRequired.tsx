"use client";

import type { ReactNode } from "react";
import { Building2 } from "lucide-react";
import { CompanyPickerList, useCompanyScope } from "@/providers/CompanyScopeProvider";

/**
 * Shown under the top bar while a SYSADMIN views all companies: that view is a
 * read-only overview, and every write needs a selected company.
 */
export function CompanyScopeBanner() {
  const { needsCompany } = useCompanyScope();
  if (!needsCompany) return null;
  return (
    <div
      role="status"
      className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-1.5 text-xs text-muted-foreground md:px-6"
    >
      <Building2 className="h-3.5 w-3.5 shrink-0" />
      <span>
        Viewing all companies (read-only overview). Select a company in the top bar to create or
        change records.
      </span>
    </div>
  );
}

/**
 * Wraps a create form. A SYSADMIN viewing all companies is asked to choose the
 * company first; everyone else sees the form directly.
 */
export function CompanyRequired({ children }: { children: ReactNode }) {
  const { needsCompany, companies, selectCompany } = useCompanyScope();
  if (!needsCompany) return <>{children}</>;
  return (
    <div className="mx-auto max-w-md space-y-3 rounded-2xl border border-border bg-card p-6">
      <div>
        <h2 className="text-base font-medium text-foreground">Choose a company</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You are viewing all companies. Choose the company this record belongs to; the dashboard
          switches to it.
        </p>
      </div>
      <CompanyPickerList companies={companies} onPick={selectCompany} />
    </div>
  );
}
