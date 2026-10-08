"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  Palette,
  Radio,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { withStepUp } from "@/lib/stepUp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  createCompanyAction,
  createPaymentAccountAction,
  getCompanyPaymentAccounts,
  registerPaymentAccountStatementAction,
  updateCompanyBranding,
  testCompanyPaymentAccount,
  updatePaymentAccountAction,
  type PaymentReadiness,
  type CompanySummary,
  type PaymentAccountPayload,
  type CompanyPaymentAccountView,
  type MpesaProbeResult,
} from "@/actions/companies";

type Props = {
  companies: CompanySummary[];
  /** Whether each active company can take payments; empty when it could not be read. */
  readiness: PaymentReadiness[];
  canMutate: boolean;
};

type CredentialsForm = {
  account: CompanyPaymentAccountView;
  clientKey: string;
  clientSecret: string;
  passkey: string;
  nominatedNumber: string;
  isDefault: boolean;
  isActive: boolean;
};

/** How the Safaricom statement registration of one account reads to an operator. */
function statementStatus(acct: CompanyPaymentAccountView): { label: string; tone: string; detail?: string } {
  const at = acct.pullRegisteredAt ? ` \u00b7 ${acct.pullRegisteredAt.replace("T", " ").slice(0, 16)}` : "";
  switch (acct.pullRegistrationStatus) {
    case "REGISTERED":
      return { label: `Registered${at}`, tone: "text-emerald-500" };
    case "ALREADY_REGISTERED":
      return { label: `Confirmed${at}`, tone: "text-emerald-500" };
    case "FAILED":
      return { label: `Failed${at}`, tone: "text-rose-500", detail: acct.pullRegistrationError ?? undefined };
    default:
      return {
        label: acct.pullNominatedNumber ? "Not registered" : "Needs nominated number",
        tone: "text-amber-500",
      };
  }
}

type BrandingForm = {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  supportPhone: string;
  supportEmail: string;
  subdomain: string;
  customDomain: string;
};

const EMPTY_BRANDING: BrandingForm = {
  primaryColor: "",
  secondaryColor: "",
  logoUrl: "",
  supportPhone: "",
  supportEmail: "",
  subdomain: "",
  customDomain: "",
};

export default function CompaniesClient({ companies, readiness, canMutate }: Props) {
  const router = useRouter();
  const [credentialsFor, setCredentialsFor] = useState<CredentialsForm | null>(null);
  const [rows, setRows] = useState<CompanySummary[]>(companies);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ready" | "needs-setup" | "unavailable">("all");
  const [companyOpen, setCompanyOpen] = useState(false);
  const [accountFor, setAccountFor] = useState<CompanySummary | null>(null);
  const [brandingFor, setBrandingFor] = useState<CompanySummary | null>(null);
  const [accountsFor, setAccountsFor] = useState<CompanySummary | null>(null);
  const [probeResult, setProbeResult] = useState<MpesaProbeResult | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");

  const [accountType, setAccountType] = useState<"PAYBILL" | "TILL" | "BANK">("PAYBILL");
  const [shortCode, setShortCode] = useState("");
  const [tillNumber, setTillNumber] = useState("");
  const [clientKey, setClientKey] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [passkey, setPasskey] = useState("");
  const [nominatedNumber, setNominatedNumber] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const [branding, setBranding] = useState<BrandingForm>(EMPTY_BRANDING);
  const [paymentAccounts, setPaymentAccounts] = useState<CompanyPaymentAccountView[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const [isPending, startTransition] = useTransition();
  const readinessByCode = useMemo(
    () => new Map(readiness.map((state) => [state.companyCode, state])),
    [readiness]
  );
  const readyCount = rows.filter((company) => readinessByCode.get(company.code)?.ready).length;
  const setupCount = rows.filter((company) => {
    const state = readinessByCode.get(company.code);
    return state !== undefined && !state.ready;
  }).length;
  const unavailableCount = rows.length - readyCount - setupCount;
  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((company) => {
      const state = readinessByCode.get(company.code);
      const matchesSearch =
        !query ||
        [company.name, company.alias, company.code].some((value) => value.toLowerCase().includes(query));
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "ready" && state?.ready === true) ||
        (statusFilter === "needs-setup" && state !== undefined && !state.ready) ||
        (statusFilter === "unavailable" && state === undefined);
      return matchesSearch && matchesStatus;
    });
  }, [readinessByCode, rows, search, statusFilter]);

  function resetCompanyForm() {
    setCode("");
    setName("");
    setAlias("");
  }

  function resetAccountForm() {
    setAccountType("PAYBILL");
    setShortCode("");
    setTillNumber("");
    setClientKey("");
    setClientSecret("");
    setPasskey("");
    setNominatedNumber("");
    setIsDefault(false);
  }

  function resetBrandingForm() {
    setBranding(EMPTY_BRANDING);
  }

  function handleCreateCompany() {
    if (!code.trim() || !name.trim() || !alias.trim()) {
      toast.error("Code, name and alias are required.");
      return;
    }
    startTransition(async () => {
      const res = await createCompanyAction({
        code: code.trim(),
        name: name.trim(),
        alias: alias.trim(),
      });
      if (res.success && res.data) {
        toast.success(`Company ${res.data.code} created`);
        setCompanyOpen(false);
        resetCompanyForm();
        setRows((prev) => [...prev.filter((c) => c.code !== res.data!.code), res.data!]);
      } else {
        toast.error(res.message || "Failed to create company");
      }
    });
  }

  function handleCreateAccount() {
    if (!accountFor) return;
    if (!shortCode.trim()) {
      toast.error("Short code is required.");
      return;
    }
    if (accountType === "TILL" && !tillNumber.trim()) {
      toast.error("Till number is required for TILL accounts.");
      return;
    }
    if (accountType !== "BANK" && (!clientKey.trim() || !clientSecret.trim() || !passkey.trim())) {
      toast.error("Consumer key, consumer secret and passkey are all required to collect payments.");
      return;
    }
    const payload: PaymentAccountPayload = {
      accountType,
      shortCode: shortCode.trim(),
      tillNumber: accountType === "TILL" ? tillNumber.trim() : undefined,
      clientKey: clientKey.trim() || undefined,
      clientSecret: clientSecret.trim() || undefined,
      passkey: passkey.trim() || undefined,
      nominatedNumber: accountType !== "BANK" ? nominatedNumber.trim() || undefined : undefined,
      isDefault,
    };
    startTransition(async () => {
      const res = await withStepUp(
        (token) => createPaymentAccountAction(accountFor.code, payload, token),
        "Updating payment gateway credentials requires re-authentication."
      );
      if (res.success) {
        toast.success(`Payment account added for ${accountFor.code}`, {
          description: payload.nominatedNumber
            ? "Open Paybills & Tills to see whether Safaricom registered it for the transaction statement."
            : "No nominated number given: it is not registered for Safaricom's transaction statement yet.",
        });
        setAccountFor(null);
        resetAccountForm();
      } else {
        toast.error(res.message || "Failed to add payment account");
      }
    });
  }

  function openBranding(company: CompanySummary) {
    setBrandingFor(company);
    setBranding({
      primaryColor: "",
      secondaryColor: "",
      logoUrl: "",
      supportPhone: "",
      supportEmail: "",
      subdomain: "",
      customDomain: "",
    });
  }

  function handleSaveBranding() {
    if (!brandingFor) return;
    startTransition(async () => {
      const res = await updateCompanyBranding(brandingFor.code, branding);
      if (res.success) {
        toast.success(`Branding updated for ${brandingFor.code}`);
        setBrandingFor(null);
        resetBrandingForm();
      } else {
        toast.error(res.message || "Failed to update branding");
      }
    });
  }

  function openAccounts(company: CompanySummary) {
    setAccountsFor(company);
    setProbeResult(null);
    setLoadingAccounts(true);
    startTransition(async () => {
      const res = await getCompanyPaymentAccounts(company.code);
      if (res.success && res.data) {
        setPaymentAccounts(res.data);
      } else {
        setPaymentAccounts([]);
        toast.error(res.message || "Failed to load payment accounts");
      }
      setLoadingAccounts(false);
    });
  }

  function reloadAccounts(company: CompanySummary) {
    startTransition(async () => {
      const res = await getCompanyPaymentAccounts(company.code);
      if (res.success && res.data) setPaymentAccounts(res.data);
      router.refresh();
    });
  }

  function handleSaveCredentials() {
    if (!credentialsFor || !accountsFor) return;
    const f = credentialsFor;
    const company = accountsFor;
    const payload = {
      // a blank field keeps what is stored
      ...(f.clientKey.trim() ? { clientKey: f.clientKey.trim() } : {}),
      ...(f.clientSecret.trim() ? { clientSecret: f.clientSecret.trim() } : {}),
      ...(f.passkey.trim() ? { passkey: f.passkey.trim() } : {}),
      ...(f.nominatedNumber.trim() && f.nominatedNumber.trim() !== (f.account.pullNominatedNumber ?? "")
        ? { nominatedNumber: f.nominatedNumber.trim() }
        : {}),
      ...(f.isDefault !== Boolean(f.account.isDefault) ? { isDefault: f.isDefault } : {}),
      ...(f.isActive !== Boolean(f.account.isActive) ? { isActive: f.isActive } : {}),
    };
    if (Object.keys(payload).length === 0) {
      toast.error("Nothing to change: fill in the credential or number to replace, or change a switch.");
      return;
    }
    startTransition(async () => {
      const res = await withStepUp(
        (token) => updatePaymentAccountAction(company.code, f.account.id, payload, token),
        "Updating payment gateway credentials requires re-authentication."
      );
      if (res.success) {
        toast.success(`Payment account ${f.account.shortCode} updated`, {
          description: "Use Test Ping to confirm M-Pesa accepts the new credentials.",
        });
        setCredentialsFor(null);
        setProbeResult(null);
        reloadAccounts(company);
      } else {
        toast.error(res.message || "Failed to update the payment account");
      }
    });
  }

  /** Registers the account with Safaricom, or confirms it when it is registered already. */
  function handleRegisterStatement(acct: CompanyPaymentAccountView) {
    if (!accountsFor) return;
    const company = accountsFor;
    if (!acct.pullNominatedNumber) {
      toast.error("Add the nominated Safaricom number first.", {
        description: "Use Replace credentials on this account and fill in the nominated number.",
      });
      return;
    }
    startTransition(async () => {
      const res = await registerPaymentAccountStatementAction(acct.id);
      if (res.success && res.data) {
        if (res.data.succeeded) {
          toast.success(
            res.data.status === "ALREADY_REGISTERED"
              ? `Safaricom confirms ${acct.shortCode} is registered`
              : `${acct.shortCode} registered with Safaricom`
          );
        } else {
          toast.error(`Safaricom did not register ${acct.shortCode}`, { description: res.data.detail });
        }
      } else {
        toast.error(res.message || "Registration could not be sent");
      }
      reloadAccounts(company);
    });
  }

  function handleTestPing() {
    if (!accountsFor) return;
    startTransition(async () => {
      const res = await testCompanyPaymentAccount(accountsFor.code);
      if (res.success && res.data) {
        setProbeResult(res.data);
        toast.success(res.data.ok ? "Ping successful" : "Ping failed", {
          description: res.data.message,
        });
      } else {
        toast.error(res.message || "Ping failed");
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 pb-8 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            System management
          </p>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Companies</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Manage tenant profiles and keep each company&apos;s payment setup ready.
            </p>
          </div>
        </div>
        {canMutate && (
          <Button
            className="h-10 w-full gap-2 rounded-full px-5 sm:w-auto"
            onClick={() => {
              resetCompanyForm();
              setCompanyOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New company
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total companies</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{rows.length}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Payment ready</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{readyCount}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Needs setup</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{setupCount}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/15 text-warning">
              <AlertCircle className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>
      </div>

      {!canMutate && (
        <Card className="border-warning/30 bg-warning/5 shadow-sm">
          <CardContent className="flex items-center gap-2 py-3 text-sm text-foreground">
            <ShieldAlert className="h-4 w-4 text-warning" />
            Company creation and payment account changes are restricted to SYSADMIN.
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Company directory</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Search profiles, check payment readiness, and manage company settings.
            </p>
          </div>
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search companies"
              placeholder="Search name, alias, or code"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 rounded-full pl-9"
            />
          </div>
        </div>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Filter companies by payment status">
            {([
              ["all", "All companies", rows.length],
              ["ready", "Payment ready", readyCount],
              ["needs-setup", "Needs setup", setupCount],
              ["unavailable", "Status unavailable", unavailableCount],
            ] as const).map(([value, label, count]) => (
              <button
                key={value}
                type="button"
                aria-pressed={statusFilter === value}
                onClick={() => setStatusFilter(value)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  statusFilter === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                    statusFilter === value ? "bg-primary-foreground/15" : "bg-muted"
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          {filteredCompanies.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </span>
              <p className="mt-3 font-medium text-foreground">
                {rows.length === 0 ? "No companies yet" : "No matching companies"}
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {rows.length === 0
                  ? "Create a company to start configuring its profile and payment setup."
                  : "Try a different search or payment status filter."}
              </p>
              {rows.length === 0 && canMutate && (
                <Button
                  className="mt-4 rounded-full"
                  onClick={() => {
                    resetCompanyForm();
                    setCompanyOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create company
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredCompanies.map((company) => {
                const state = readinessByCode.get(company.code);
                return (
                  <article
                    key={company.code}
                    className="flex min-w-0 flex-col rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg font-semibold text-primary">
                        {company.name.trim().charAt(0).toUpperCase() || "C"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-foreground" title={company.name}>
                          {company.name}
                        </h3>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground" title={company.alias}>
                          {company.alias}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] font-medium text-muted-foreground">
                        {company.code}
                      </span>
                      {state?.ready ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Payment ready
                        </span>
                      ) : state ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Needs setup
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Status unavailable
                        </span>
                      )}
                    </div>

                    <div className="mt-3 min-h-10 text-sm text-muted-foreground">
                      {state?.ready ? (
                        <p>
                          Default account: <span className="font-medium text-foreground">{state.accountType} {state.shortCode}</span>
                        </p>
                      ) : state ? (
                        <p className="line-clamp-2 text-warning" title={state.problem ?? undefined}>
                          {state.problem || "Payment setup needs attention."}
                        </p>
                      ) : (
                        <p>Payment readiness could not be loaded.</p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 flex-1 gap-1.5 px-2 text-xs sm:px-3"
                        onClick={() => openBranding(company)}
                      >
                        <Palette className="h-3.5 w-3.5 shrink-0" />
                        Brand profile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 flex-1 gap-1.5 px-2 text-xs sm:px-3"
                        onClick={() => openAccounts(company)}
                      >
                        <Radio className="h-3.5 w-3.5 shrink-0" />
                        Accounts
                      </Button>
                      {canMutate && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-9 w-full gap-1.5 text-xs"
                          onClick={() => {
                            resetAccountForm();
                            setAccountFor(company);
                          }}
                        >
                          <WalletCards className="h-3.5 w-3.5" />
                          Add payment account
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Company dialog */}
      <Dialog open={companyOpen} onOpenChange={setCompanyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Company</DialogTitle>
            <DialogDescription>
              Create a tenant company. Codes are stored uppercase (e.g. CMP-ADR-001).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cc-code">Code</Label>
              <Input id="cc-code" placeholder="CMP-XXX-001" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-name">Name</Label>
              <Input id="cc-name" placeholder="Company legal name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-alias">Alias</Label>
              <Input id="cc-alias" placeholder="Short alias" value={alias} onChange={(e) => setAlias(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompanyOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCompany} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment account dialog */}
      <Dialog open={accountFor !== null} onOpenChange={(open) => !open && setAccountFor(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Account — {accountFor?.code}</DialogTitle>
            <DialogDescription>
              Add an M-Pesa PAYBILL or TILL account. Credentials are encrypted at rest.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pa-type">Account type</Label>
              <Select value={accountType} onValueChange={(v) => setAccountType(v as "PAYBILL" | "TILL" | "BANK")}>
                <SelectTrigger id="pa-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAYBILL">PAYBILL</SelectItem>
                  <SelectItem value="TILL">TILL</SelectItem>
                  <SelectItem value="BANK">BANK</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pa-short">Short code</Label>
              <Input id="pa-short" placeholder="e.g. 4328053" value={shortCode} onChange={(e) => setShortCode(e.target.value)} />
            </div>
            {accountType === "TILL" && (
              <div className="space-y-2">
                <Label htmlFor="pa-till">Till number</Label>
                <Input id="pa-till" placeholder="Till number" value={tillNumber} onChange={(e) => setTillNumber(e.target.value)} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pa-key">Consumer key</Label>
                <Input id="pa-key" type="password" placeholder="••••••••" value={clientKey} onChange={(e) => setClientKey(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pa-secret">Consumer secret</Label>
                <Input id="pa-secret" type="password" placeholder="••••••••" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pa-passkey">Passkey (M-Pesa online)</Label>
              <Input id="pa-passkey" type="password" placeholder="••••••••" value={passkey} onChange={(e) => setPasskey(e.target.value)} />
              <p className="text-xs text-muted-foreground">Issued by Safaricom with the consumer key and secret. Without it customers cannot be prompted to pay.</p>
            </div>
            {accountType !== "BANK" && (
              <div className="space-y-2">
                <Label htmlFor="pa-nominated">Nominated Safaricom number</Label>
                <Input id="pa-nominated" inputMode="tel" placeholder="e.g. 0722000000" value={nominatedNumber} onChange={(e) => setNominatedNumber(e.target.value)} />
                <p className="text-xs text-muted-foreground">A Safaricom line of the organisation that owns this paybill or till. Safaricom needs it to release the transaction statement; it can be added later.</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox id="pa-default" checked={isDefault} onCheckedChange={(checked) => setIsDefault(checked === true)} />
              <Label htmlFor="pa-default" className="text-sm font-normal cursor-pointer">
                Set as default account
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountFor(null)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAccount} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              Add account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Branding dialog */}
      <Dialog open={brandingFor !== null} onOpenChange={(open) => !open && setBrandingFor(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Brand Profile — {brandingFor?.code}</DialogTitle>
            <DialogDescription>
              Update theme colors, logo, support contacts, and domain settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="b-primary">Primary Color</Label>
                <Input id="b-primary" placeholder="#f59e0b" value={branding.primaryColor} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="b-secondary">Secondary Color</Label>
                <Input id="b-secondary" placeholder="#18181b" value={branding.secondaryColor} onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-logo">Logo URL</Label>
              <Input id="b-logo" placeholder="https://..." value={branding.logoUrl} onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="b-phone">Support Phone</Label>
                <Input id="b-phone" placeholder="+254..." value={branding.supportPhone} onChange={(e) => setBranding({ ...branding, supportPhone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="b-email">Support Email</Label>
                <Input id="b-email" placeholder="support@..." value={branding.supportEmail} onChange={(e) => setBranding({ ...branding, supportEmail: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-subdomain">Subdomain</Label>
              <Input id="b-subdomain" placeholder="tenant" value={branding.subdomain} onChange={(e) => setBranding({ ...branding, subdomain: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-custom">Custom Domain</Label>
              <Input id="b-custom" placeholder="tenant.example.com" value={branding.customDomain} onChange={(e) => setBranding({ ...branding, customDomain: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBrandingFor(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBranding} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Replace credentials dialog */}
      <Dialog open={credentialsFor !== null} onOpenChange={(open) => !open && setCredentialsFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Replace credentials — {credentialsFor?.account.accountType} {credentialsFor?.account.shortCode}
            </DialogTitle>
            <DialogDescription>
              Fill in only what you are replacing; a blank field keeps what is stored. The short code cannot be
              changed: for a different paybill or till, add a new account and make it the default.
            </DialogDescription>
          </DialogHeader>
          {credentialsFor && (
            <div className="space-y-3">
              {(
                [
                  ["clientKey", "Consumer key"],
                  ["clientSecret", "Consumer secret"],
                  ["passkey", "Passkey (M-Pesa online)"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={`cred-${key}`}>{label}</Label>
                  <Input
                    id={`cred-${key}`}
                    type="password"
                    autoComplete="off"
                    placeholder="Leave blank to keep"
                    value={credentialsFor[key]}
                    onChange={(e) => setCredentialsFor({ ...credentialsFor, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="space-y-2">
                <Label htmlFor="cred-nominated">Nominated Safaricom number</Label>
                <Input
                  id="cred-nominated"
                  inputMode="tel"
                  placeholder="e.g. 0722000000"
                  value={credentialsFor.nominatedNumber}
                  onChange={(e) => setCredentialsFor({ ...credentialsFor, nominatedNumber: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  A Safaricom line of the organisation that owns this paybill or till. Saving a new number registers the account for Safaricom&apos;s transaction statement if it is not registered yet.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="cred-default"
                  checked={credentialsFor.isDefault}
                  onCheckedChange={(v) => setCredentialsFor({ ...credentialsFor, isDefault: v === true })}
                />
                <Label htmlFor="cred-default">Default account (the one customers pay into)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="cred-active"
                  checked={credentialsFor.isActive}
                  onCheckedChange={(v) => setCredentialsFor({ ...credentialsFor, isActive: v === true })}
                />
                <Label htmlFor="cred-active">Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCredentialsFor(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCredentials} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paybills & Tills dialog */}
      <Dialog open={accountsFor !== null} onOpenChange={(open) => !open && setAccountsFor(null)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Paybills &amp; Tills — {accountsFor?.code}</DialogTitle>
            <DialogDescription>
              Masked payment accounts. Consumer key last 4 characters are visible for verification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {loadingAccounts ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading accounts...
              </div>
            ) : paymentAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No payment accounts configured.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Short Code</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Consumer Key</TableHead>
                    <TableHead>Credentials</TableHead>
                    <TableHead>Safaricom statement</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Active</TableHead>
                    {canMutate && <TableHead />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentAccounts.map((acct) => (
                    <TableRow key={`${acct.accountType}-${acct.shortCode}`}>
                      <TableCell className="font-mono text-xs">{acct.accountType}</TableCell>
                      <TableCell className="font-mono text-xs">{acct.shortCode}</TableCell>
                      <TableCell className="text-xs">{acct.accountReference ?? "\u2014"}</TableCell>
                      <TableCell className="text-xs">{acct.provider}</TableCell>
                      <TableCell className="font-mono text-xs">{acct.maskedConsumerKey ?? "\u2014"}</TableCell>
                      <TableCell className="text-xs">
                        {acct.credentialsComplete === null || acct.credentialsComplete === undefined ? (
                          "\u2014"
                        ) : acct.credentialsComplete ? (
                          <span className="text-emerald-500">Complete</span>
                        ) : (
                          <span className="text-rose-500">Incomplete</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {acct.accountType === "BANK" ? (
                          "\u2014"
                        ) : (
                          <span className={statementStatus(acct).tone} title={statementStatus(acct).detail}>
                            {statementStatus(acct).label}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{acct.isDefault ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-xs">{acct.isActive ? "Yes" : "No"}</TableCell>
                      {canMutate && (
                        <TableCell className="text-right whitespace-nowrap">
                          {acct.accountType !== "BANK" && acct.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7"
                              disabled={isPending}
                              onClick={() => handleRegisterStatement(acct)}
                            >
                              {acct.pullRegistrationStatus === "REGISTERED" ||
                              acct.pullRegistrationStatus === "ALREADY_REGISTERED"
                                ? "Check registration"
                                : "Register"}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7"
                            onClick={() =>
                              setCredentialsFor({
                                account: acct,
                                clientKey: "",
                                clientSecret: "",
                                passkey: "",
                                nominatedNumber: acct.pullNominatedNumber ?? "",
                                isDefault: Boolean(acct.isDefault),
                                isActive: Boolean(acct.isActive),
                              })
                            }
                          >
                            Replace credentials
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleTestPing}
                disabled={isPending || paymentAccounts.length === 0}
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Test Ping
              </Button>
              {probeResult && (
                <span className={`text-xs ${probeResult.ok ? "text-emerald-400" : "text-rose-400"}`}>
                  {probeResult.ok ? "OK" : "FAIL"}: {probeResult.message} ({probeResult.latencyMs}ms)
                </span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountsFor(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
