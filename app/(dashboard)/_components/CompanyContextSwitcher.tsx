"use client";

import { useState } from "react";
import { Building2, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCompanyScope } from "@/providers/CompanyScopeProvider";

export default function CompanyContextSwitcher({
  companyScope,
}: {
  companyScope?: string | null;
}) {
  // Selection, option list and stale-selection reset live in CompanyScopeProvider.
  const {
    isPlatformAdmin: isSysadmin,
    companyCode: selected,
    companies,
    switching: isPending,
    selectCompany,
  } = useCompanyScope();
  const [open, setOpen] = useState(false);

  const onSelect = (code: string | null) => {
    setOpen(false);
    selectCompany(code);
  };

  // Roles 01–05 can never switch — show a read-only label with their JWT scope.
  if (!isSysadmin) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs whitespace-nowrap">
        <Building2 className="w-3.5 h-3.5 shrink-0" />
        <span className="font-medium">{companyScope ?? "All companies"}</span>
      </div>
    );
  }

  const currentLabel = selected ?? "ALL";

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Switch company context"
          className="h-8 gap-1.5 px-2.5 text-xs font-medium"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <span className="max-w-[10rem] truncate font-mono text-[11px]">
            {currentLabel}
          </span>
          <ChevronsUpDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
          Tenant context (SYSADMIN)
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => onSelect("ALL")}
        >
          <Check
            className={`mr-2 h-4 w-4 ${selected == null ? "opacity-100" : "opacity-0"}`}
          />
          <span className="flex-1">All companies (union)</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {companies.length === 0 ? (
          <DropdownMenuItem disabled className="text-muted-foreground text-xs">
            No companies available
          </DropdownMenuItem>
        ) : (
          companies.map((company) => (
            <DropdownMenuItem
              key={company.code}
              className="cursor-pointer"
              onClick={() => onSelect(company.code)}
            >
              <Check
                className={`mr-2 h-4 w-4 ${
                  selected?.toUpperCase() === company.code.toUpperCase()
                    ? "opacity-100"
                    : "opacity-0"
                }`}
              />
              <span className="flex-1 truncate">{company.name}</span>
              <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                {company.code}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}