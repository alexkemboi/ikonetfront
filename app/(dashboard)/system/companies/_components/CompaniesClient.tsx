"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Loader2, Plus, ShieldAlert, Palette, Radio } from "lucide-react";
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
  isDefault: boolean;
  isActive: boolean;
};

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
  const [isDefault, setIsDefault] = useState(false);

  const [branding, setBranding] = useState<BrandingForm>(EMPTY_BRANDING);
  const [paymentAccounts, setPaymentAccounts] = useState<CompanyPaymentAccountView[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const [isPending, startTransition] = useTransition();

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
      isDefault,
    };
    startTransition(async () => {
      const res = await withStepUp(
        (token) => createPaymentAccountAction(accountFor.code, payload, token),
        "Updating payment gateway credentials requires re-authentication."
      );
      if (res.success) {
        toast.success(`Payment account added for ${accountFor.code}`);
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
      ...(f.isDefault !== Boolean(f.account.isDefault) ? { isDefault: f.isDefault } : {}),
      ...(f.isActive !== Boolean(f.account.isActive) ? { isActive: f.isActive } : {}),
    };
    if (Object.keys(payload).length === 0) {
      toast.error("Nothing to change: fill in the credential to replace, or change a switch.");
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Companies</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage tenant companies and their M-Pesa payment accounts.
          </p>
        </div>
        {canMutate && (
          <Button
            className="gap-2 h-9"
            onClick={() => {
              resetCompanyForm();
              setCompanyOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            New Company
          </Button>
        )}
      </div>

      {!canMutate && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-center gap-2 py-3 text-xs text-foreground">
            <ShieldAlert className="w-4 h-4 text-warning" />
            Creating companies and payment accounts is restricted to SYSADMIN.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Alias</TableHead>
                <TableHead>Payments</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No companies found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((company) => (
                  <TableRow key={company.code}>
                    <TableCell className="font-mono text-xs font-medium">{company.code}</TableCell>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell className="text-muted-foreground">{company.alias}</TableCell>
                    <TableCell className="max-w-xs text-xs">
                      {(() => {
                        const state = readiness.find((r) => r.companyCode === company.code);
                        if (!state) return <span className="text-muted-foreground">{"\u2014"}</span>;
                        return state.ready ? (
                          <span className="text-emerald-500">
                            Ready · {state.accountType} {state.shortCode}
                          </span>
                        ) : (
                          <span className="text-rose-500">Cannot take payments: {state.problem}</span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5"
                          onClick={() => openBranding(company)}
                        >
                          <Palette className="w-3.5 h-3.5" />
                          Edit Brand Profile
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5"
                          onClick={() => openAccounts(company)}
                        >
                          <Radio className="w-3.5 h-3.5" />
                          Paybills &amp; Tills
                        </Button>
                        {canMutate && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5"
                            onClick={() => {
                              resetAccountForm();
                              setAccountFor(company);
                            }}
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            Payment Account
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
        <DialogContent className="sm:max-w-2xl">
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
                      <TableCell className="text-xs">{acct.isDefault ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-xs">{acct.isActive ? "Yes" : "No"}</TableCell>
                      {canMutate && (
                        <TableCell className="text-right">
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
