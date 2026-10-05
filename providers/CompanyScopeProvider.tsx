"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { writeContextCookie } from "@/lib/companyContextClient";
import {
  initCompanyContext,
  setCompanyContext,
  setContextSwitching,
} from "@/store/slices/companyContextSlice";
import type { AppDispatch } from "@/store";
import type { CompanySummary } from "@/actions/companies";

type CompanyScope = {
  /** SYSADMIN: the only role that works across companies. */
  isPlatformAdmin: boolean;
  /** Company the request is scoped to; `null` = all companies (SYSADMIN only). */
  companyCode: string | null;
  /** Active companies a SYSADMIN may select (empty for every other role). */
  companies: CompanySummary[];
  /** SYSADMIN viewing all companies: reads work, writes need a company first. */
  needsCompany: boolean;
  switching: boolean;
  /** Switch the company context (`null` = all companies) and rerun server reads. */
  selectCompany: (code: string | null) => void;
  /**
   * Run `action` only once a company is selected. A SYSADMIN viewing all
   * companies is asked to choose one first; everyone else runs it at once.
   */
  requireCompany: (action: () => void) => void;
};

const CompanyScopeContext = createContext<CompanyScope>({
  isPlatformAdmin: false,
  companyCode: null,
  companies: [],
  needsCompany: false,
  switching: false,
  selectCompany: () => {},
  requireCompany: (action) => action(),
});

/**
 * Company scope for the dashboard shell (tenancy F1).
 *
 * The server layout resolves the selected company from the context cookie and
 * passes it down, so this always agrees with what server actions send as
 * `X-Company-Context`. A selection that no longer names an active company is
 * cleared here: the backend refuses it (400 `UNKNOWN_COMPANY_CONTEXT`) on
 * every call until it is.
 */
export function CompanyScopeProvider({
  isPlatformAdmin,
  companyCode,
  companies,
  children,
}: {
  isPlatformAdmin: boolean;
  companyCode: string | null;
  companies: CompanySummary[];
  children: ReactNode;
}) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [isPending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);

  const selectCompany = useCallback(
    (code: string | null) => {
      const next = code && code.toUpperCase() !== "ALL" ? code : null;
      writeContextCookie(next);
      dispatch(setCompanyContext(next));
      dispatch(setContextSwitching(true));
      startTransition(() => {
        try {
          router.refresh();
        } finally {
          dispatch(setContextSwitching(false));
        }
      });
    },
    [dispatch, router]
  );

  useEffect(() => {
    dispatch(initCompanyContext());
    // Only SYSADMIN may carry a selection; drop a cookie left by another login.
    if (!isPlatformAdmin) writeContextCookie(null);
  }, [dispatch, isPlatformAdmin]);

  // An empty list means the companies could not be loaded, not that the
  // selection is stale — leave it alone in that case.
  const selectionIsStale =
    isPlatformAdmin &&
    companyCode !== null &&
    companies.length > 0 &&
    !companies.some((c) => c.code.toUpperCase() === companyCode.toUpperCase());

  const clearedSelection = useRef<string | null>(null);
  useEffect(() => {
    // Once per stale value: the refresh that follows brings the cleared selection back as a prop.
    if (!selectionIsStale || clearedSelection.current === companyCode) return;
    clearedSelection.current = companyCode;
    toast.warning(`Company ${companyCode} is no longer available. Showing all companies.`);
    selectCompany(null);
  }, [selectionIsStale, companyCode, selectCompany]);

  const needsCompany = isPlatformAdmin && (companyCode === null || selectionIsStale);

  const requireCompany = useCallback(
    (action: () => void) => {
      if (!needsCompany) {
        action();
        return;
      }
      pendingAction.current = action;
      setPickerOpen(true);
    },
    [needsCompany]
  );

  const onPick = (code: string) => {
    const action = pendingAction.current;
    pendingAction.current = null;
    setPickerOpen(false);
    selectCompany(code);
    action?.();
  };

  const value = useMemo<CompanyScope>(
    () => ({
      isPlatformAdmin,
      companyCode: selectionIsStale ? null : companyCode,
      companies,
      needsCompany,
      switching: isPending,
      selectCompany,
      requireCompany,
    }),
    [isPlatformAdmin, companyCode, selectionIsStale, companies, needsCompany, isPending, selectCompany, requireCompany]
  );

  return (
    <CompanyScopeContext.Provider value={value}>
      {children}
      <Dialog
        open={pickerOpen}
        onOpenChange={(open) => {
          if (!open) pendingAction.current = null;
          setPickerOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Choose a company</DialogTitle>
            <DialogDescription>
              You are viewing all companies. Choose the company this record belongs to; the
              dashboard switches to it.
            </DialogDescription>
          </DialogHeader>
          <CompanyPickerList companies={companies} onPick={onPick} />
        </DialogContent>
      </Dialog>
    </CompanyScopeContext.Provider>
  );
}

export function CompanyPickerList({
  companies,
  onPick,
}: {
  companies: CompanySummary[];
  onPick: (code: string) => void;
}) {
  if (companies.length === 0) {
    return <p className="text-sm text-muted-foreground">No companies available.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {companies.map((company) => (
        <li key={company.code}>
          <button
            type="button"
            onClick={() => onPick(company.code)}
            className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
          >
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">{company.name}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{company.code}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function useCompanyScope(): CompanyScope {
  return useContext(CompanyScopeContext);
}
