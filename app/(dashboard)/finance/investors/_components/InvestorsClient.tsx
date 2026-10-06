"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Router as RouterIcon, FileText, Building2, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCompanyScope } from "@/providers/CompanyScopeProvider";
import {
  assignRouterAction,
  createAgreementAction,
  createInvestorAction,
  endAgreementAction,
  endRouterAssignmentAction,
  getInvestor,
  linkInvestorCompanyAction,
  runInvestorBillingAction,
  updateInvestorAction,
} from "@/actions/investorRegistry";
import type {
  InvestorAgreementDetail,
  InvestorDetail,
  InvestorInput,
  InvestorRule,
  InvestorSummary,
  RuleBasis,
} from "@/lib/types/investor";

type RouterOption = { id: number; name: string };

type Props = {
  investors: InvestorSummary[];
  routers: RouterOption[];
  isPlatformAdmin: boolean;
};

const EMPTY_INVESTOR: InvestorInput = { legalName: "", contactName: "", phone: "", email: "", notes: "" };

const BASIS_LABEL: Record<RuleBasis, string> = {
  PERCENTAGE_OF_GROSS: "% of revenue",
  FIXED_PER_ACTIVE_SUBSCRIBER: "KSh per active subscriber",
  FIXED_MONTHLY: "KSh per month",
};

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function ruleText(rule: InvestorRule): string {
  const service = rule.serviceType === "HOTSPOT" ? "Hotspot" : "PPPoE";
  return rule.calculationBasis === "PERCENTAGE_OF_GROSS"
    ? `${service}: ${rule.rateValue}% of revenue`
    : `${service}: KSh ${rule.rateValue} ${rule.calculationBasis === "FIXED_MONTHLY" ? "per month" : "per active subscriber"}`;
}

function day(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function lastMonth(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function InvestorsClient({ investors, routers, isPlatformAdmin }: Props) {
  const router = useRouter();
  const { requireCompany, companyCode } = useCompanyScope();
  const [pending, startTransition] = useTransition();

  const [detail, setDetail] = useState<InvestorDetail | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [investorForm, setInvestorForm] = useState<{ id: string | null; values: InvestorInput } | null>(null);
  const [agreementForm, setAgreementForm] = useState<{
    name: string;
    start: string;
    end: string;
    hotspotBasis: RuleBasis | "";
    hotspotRate: string;
    pppoeBasis: RuleBasis | "";
    pppoeRate: string;
  } | null>(null);
  const [assignForm, setAssignForm] = useState<{ agreementId: string; routerId: string; start: string } | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<string | null>(null);

  const openDetail = useCallback((investorId: string) => {
    setLoadingId(investorId);
    startTransition(async () => {
      const res = await getInvestor(investorId);
      setLoadingId(null);
      if (res.success && res.data) setDetail(res.data);
      else toast.error(res.message || "Could not load the investor");
    });
  }, []);

  /** Runs a change, reports it, and reloads both the list and the open investor. */
  const run = (work: () => Promise<{ success: boolean; message?: string }>, done: string, after?: () => void) => {
    startTransition(async () => {
      const res = await work();
      if (!res.success) {
        toast.error(res.message || "The change was refused");
        return;
      }
      toast.success(done);
      after?.();
      router.refresh();
      if (detail) {
        const fresh = await getInvestor(detail.id);
        if (fresh.success && fresh.data) setDetail(fresh.data);
      }
    });
  };

  const saveInvestor = () => {
    if (!investorForm) return;
    const values = investorForm.values;
    if (!values.legalName.trim()) {
      toast.error("Enter the investor's name.");
      return;
    }
    const id = investorForm.id;
    run(
      () => (id ? updateInvestorAction(id, values) : createInvestorAction(values)),
      id ? "Investor updated" : "Investor registered",
      () => setInvestorForm(null)
    );
  };

  const saveAgreement = () => {
    if (!agreementForm || !detail) return;
    const f = agreementForm;
    if (!f.name.trim() || !f.start) {
      toast.error("Enter a name and a start date.");
      return;
    }
    const rules: InvestorRule[] = [];
    if (f.hotspotBasis && f.hotspotRate !== "") {
      rules.push({ serviceType: "HOTSPOT", calculationBasis: f.hotspotBasis, rateValue: Number(f.hotspotRate) });
    }
    if (f.pppoeBasis && f.pppoeRate !== "") {
      rules.push({ serviceType: "PPPOE", calculationBasis: f.pppoeBasis, rateValue: Number(f.pppoeRate) });
    }
    if (rules.some((r) => !Number.isFinite(r.rateValue) || r.rateValue < 0)) {
      toast.error("A rate must be a number, zero or more.");
      return;
    }
    const investorId = detail.id;
    requireCompany(() =>
      run(
        () =>
          createAgreementAction(investorId, {
            name: f.name.trim(),
            effectiveStartDate: f.start,
            ...(f.end ? { effectiveEndDate: f.end } : {}),
            rules,
          }),
        "Agreement created",
        () => setAgreementForm(null)
      )
    );
  };

  const saveAssignment = () => {
    if (!assignForm) return;
    const f = assignForm;
    if (!f.agreementId || !f.routerId) {
      toast.error("Choose an agreement and a router.");
      return;
    }
    requireCompany(() =>
      run(
        () =>
          assignRouterAction({
            routerId: Number(f.routerId),
            agreementId: f.agreementId,
            ...(f.start ? { startDate: `${f.start}T00:00:00` } : {}),
          }),
        "Router assigned",
        () => setAssignForm(null)
      )
    );
  };

  const activeAgreements: InvestorAgreementDetail[] = (detail?.agreements ?? []).filter((a) => a.status === "ACTIVE");
  const currentRouters = (detail?.routers ?? []).filter((r) => !r.endDate);
  const pastRouters = (detail?.routers ?? []).filter((r) => r.endDate);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Investors</h1>
          <p className="text-sm text-muted-foreground">
            {isPlatformAdmin
              ? "Register investors, write their agreements and assign the routers they own."
              : "Investors working with your company, and the routers they own."}
          </p>
        </div>
        {isPlatformAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBillingPeriod(lastMonth())}>
              <FileText className="mr-2 h-4 w-4" />
              Month-end statements
            </Button>
            <Button onClick={() => setInvestorForm({ id: null, values: EMPTY_INVESTOR })}>
              <Plus className="mr-2 h-4 w-4" />
              Register investor
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Investor</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Companies</TableHead>
                <TableHead className="text-right">Agreements</TableHead>
                <TableHead className="text-right">Routers</TableHead>
                {isPlatformAdmin && <TableHead className="text-right">Accounts</TableHead>}
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isPlatformAdmin ? 8 : 7} className="py-10 text-center text-sm text-muted-foreground">
                    {isPlatformAdmin
                      ? "No investor is registered yet. Start with Register investor."
                      : "No investor is linked to your company. A system administrator registers investors and their agreements."}
                  </TableCell>
                </TableRow>
              )}
              {investors.map((inv) => (
                <TableRow key={inv.id} className="cursor-pointer" onClick={() => openDetail(inv.id)}>
                  <TableCell className="font-mono text-xs">{inv.code}</TableCell>
                  <TableCell className="font-medium">
                    {inv.legalName}
                    {loadingId === inv.id && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {[inv.contactName, inv.phone].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {inv.companies.filter((c) => c.status === "ACTIVE").map((c) => c.companyName).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-right">{inv.agreementCount}</TableCell>
                  <TableCell className="text-right">{inv.routerCount}</TableCell>
                  {isPlatformAdmin && <TableCell className="text-right">{inv.accountCount}</TableCell>}
                  <TableCell>
                    <Badge variant={inv.status === "ACTIVE" ? "default" : "secondary"}>
                      {inv.status === "ACTIVE" ? "Active" : "Retired"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── one investor ─────────────────────────────────────────────── */}
      <Sheet open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {detail.legalName} <span className="font-mono text-sm text-muted-foreground">{detail.code}</span>
                </SheetTitle>
                <SheetDescription>
                  {[detail.contactName, detail.phone, detail.email].filter(Boolean).join(" · ") || "No contact recorded"}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-4 pb-8">
                {isPlatformAdmin && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setInvestorForm({
                          id: detail.id,
                          values: {
                            legalName: detail.legalName,
                            contactName: detail.contactName ?? "",
                            phone: detail.phone ?? "",
                            email: detail.email ?? "",
                            notes: detail.notes ?? "",
                            status: detail.status,
                          },
                        })
                      }
                    >
                      Edit details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending || detail.status !== "ACTIVE"}
                      onClick={() =>
                        requireCompany(() => run(() => linkInvestorCompanyAction(detail.id), "Linked to the selected company"))
                      }
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Link to {companyCode ?? "a company"}
                    </Button>
                  </div>
                )}

                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">Companies</h3>
                  {detail.companies.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Not linked to a company yet. Creating an agreement links the investor to that company.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {detail.companies.map((c) => (
                        <Badge key={c.companyCode} variant={c.status === "ACTIVE" ? "outline" : "secondary"}>
                          {c.companyName}
                          {c.status !== "ACTIVE" && " (ended)"}
                        </Badge>
                      ))}
                    </div>
                  )}
                </section>

                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Agreements</h3>
                    {isPlatformAdmin && detail.status === "ACTIVE" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setAgreementForm({
                            name: "",
                            start: today(),
                            end: "",
                            hotspotBasis: "PERCENTAGE_OF_GROSS",
                            hotspotRate: "",
                            pppoeBasis: "FIXED_PER_ACTIVE_SUBSCRIBER",
                            pppoeRate: "",
                          })
                        }
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        New agreement
                      </Button>
                    )}
                  </div>
                  {detail.agreements.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No agreement yet. An agreement holds the charge rules and is what routers are assigned under.
                    </p>
                  )}
                  {detail.agreements.map((a) => (
                    <div key={a.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium">
                            {a.name} <span className="font-mono text-xs text-muted-foreground">{a.agreementCode}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {a.companyName ?? a.companyCode} · from {a.effectiveStartDate}
                            {a.effectiveEndDate ? ` to ${a.effectiveEndDate}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={a.status === "ACTIVE" ? "default" : "secondary"}>
                            {a.status === "ACTIVE" ? "Active" : "Ended"}
                          </Badge>
                          {isPlatformAdmin && a.status === "ACTIVE" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={pending}
                              onClick={() => requireCompany(() => run(() => endAgreementAction(a.id), "Agreement ended"))}
                            >
                              End
                            </Button>
                          )}
                        </div>
                      </div>
                      <ul className="mt-2 list-disc pl-5 text-xs">
                        {a.rules.length === 0 && <li className="text-muted-foreground">No charge rule: nothing is charged.</li>}
                        {a.rules.map((r) => (
                          <li key={r.id ?? `${r.serviceType}-${r.calculationBasis}`}>{ruleText(r)}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>

                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Routers owned</h3>
                    {activeAgreements.length > 0 && detail.status === "ACTIVE" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAssignForm({ agreementId: activeAgreements[0].id, routerId: "", start: today() })}
                      >
                        <RouterIcon className="mr-1 h-4 w-4" />
                        Assign router
                      </Button>
                    )}
                  </div>
                  {currentRouters.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {activeAgreements.length === 0
                        ? "A router is assigned under an agreement. Create the agreement first."
                        : "No router assigned. Payments through a router are credited to its owner from the start date."}
                    </p>
                  )}
                  {currentRouters.map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <div>
                        <div className="font-medium">{r.routerName ?? `Router ${r.routerId}`}</div>
                        <div className="text-xs text-muted-foreground">
                          {[r.stationName, r.companyName].filter(Boolean).join(" · ")} · {r.agreementCode} · since {day(r.startDate)}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          requireCompany(() => run(() => endRouterAssignmentAction(r.id), "Ownership ended as of now"))
                        }
                      >
                        End ownership
                      </Button>
                    </div>
                  ))}
                  {pastRouters.length > 0 && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer">Earlier ownership ({pastRouters.length})</summary>
                      <ul className="mt-1 list-disc pl-5">
                        {pastRouters.map((r) => (
                          <li key={r.id}>
                            {r.routerName ?? `Router ${r.routerId}`}: {day(r.startDate)} to {day(r.endDate)} ({r.agreementCode})
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </section>

                {isPlatformAdmin && (
                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold">Login accounts</h3>
                    {detail.accounts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No login yet. Under System &gt; Users, create a Network Partner account and choose this investor,
                        or open an existing Network Partner account and link it.
                      </p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {detail.accounts.map((acc) => (
                          <li key={acc.userId} className="flex items-center gap-2">
                            <UserRound className="h-4 w-4 text-muted-foreground" />
                            {acc.username}
                            {acc.fullName ? ` · ${acc.fullName}` : ""}
                            {!acc.active && <Badge variant="secondary">inactive</Badge>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── register / edit ──────────────────────────────────────────── */}
      <Dialog open={investorForm !== null} onOpenChange={(open) => !open && setInvestorForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{investorForm?.id ? "Edit investor" : "Register investor"}</DialogTitle>
            <DialogDescription>
              An investor belongs to the platform and can work with more than one company. The code is issued
              automatically.
            </DialogDescription>
          </DialogHeader>
          {investorForm && (
            <div className="space-y-3">
              {(
                [
                  ["legalName", "Name (person or business)"],
                  ["contactName", "Contact person"],
                  ["phone", "Phone"],
                  ["email", "Email"],
                  ["notes", "Notes"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={`inv-${key}`}>{label}</Label>
                  <Input
                    id={`inv-${key}`}
                    value={investorForm.values[key] ?? ""}
                    onChange={(e) =>
                      setInvestorForm({ ...investorForm, values: { ...investorForm.values, [key]: e.target.value } })
                    }
                  />
                </div>
              ))}
              {investorForm.id && (
                <div className="space-y-1">
                  <Label htmlFor="inv-status">Status</Label>
                  <select
                    id="inv-status"
                    className={selectClass}
                    value={investorForm.values.status ?? "ACTIVE"}
                    onChange={(e) =>
                      setInvestorForm({
                        ...investorForm,
                        values: { ...investorForm.values, status: e.target.value as "ACTIVE" | "RETIRED" },
                      })
                    }
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="RETIRED">Retired (owns no router any more)</option>
                  </select>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvestorForm(null)}>
              Cancel
            </Button>
            <Button onClick={saveInvestor} disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── new agreement ────────────────────────────────────────────── */}
      <Dialog open={agreementForm !== null} onOpenChange={(open) => !open && setAgreementForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New agreement</DialogTitle>
            <DialogDescription>
              The agreement is made with {companyCode ?? "the company you choose next"}. Routers with different terms get
              their own agreement.
            </DialogDescription>
          </DialogHeader>
          {agreementForm && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="agr-name">Name</Label>
                <Input
                  id="agr-name"
                  placeholder="e.g. Westlands routers"
                  value={agreementForm.name}
                  onChange={(e) => setAgreementForm({ ...agreementForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="agr-start">Starts</Label>
                  <Input
                    id="agr-start"
                    type="date"
                    value={agreementForm.start}
                    onChange={(e) => setAgreementForm({ ...agreementForm, start: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="agr-end">Ends (optional)</Label>
                  <Input
                    id="agr-end"
                    type="date"
                    value={agreementForm.end}
                    onChange={(e) => setAgreementForm({ ...agreementForm, end: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Maintenance charge the company keeps each month. Leave a rate empty to charge nothing for that service.
              </p>
              {(
                [
                  ["Hotspot", "hotspotBasis", "hotspotRate"],
                  ["PPPoE", "pppoeBasis", "pppoeRate"],
                ] as const
              ).map(([label, basisKey, rateKey]) => (
                <div key={label} className="grid grid-cols-[5rem_1fr_7rem] items-end gap-2">
                  <Label className="pb-2">{label}</Label>
                  <select
                    aria-label={`${label} charge basis`}
                    className={selectClass}
                    value={agreementForm[basisKey]}
                    onChange={(e) => setAgreementForm({ ...agreementForm, [basisKey]: e.target.value as RuleBasis })}
                  >
                    {(Object.keys(BASIS_LABEL) as RuleBasis[]).map((b) => (
                      <option key={b} value={b}>
                        {BASIS_LABEL[b]}
                      </option>
                    ))}
                  </select>
                  <Input
                    aria-label={`${label} rate`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Rate"
                    value={agreementForm[rateKey]}
                    onChange={(e) => setAgreementForm({ ...agreementForm, [rateKey]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAgreementForm(null)}>
              Cancel
            </Button>
            <Button onClick={saveAgreement} disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create agreement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── assign router ────────────────────────────────────────────── */}
      <Dialog open={assignForm !== null} onOpenChange={(open) => !open && setAssignForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign router</DialogTitle>
            <DialogDescription>
              A router has one owner at a time. Payments through it are credited to this investor from the start date.
            </DialogDescription>
          </DialogHeader>
          {assignForm && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="as-agreement">Agreement</Label>
                <select
                  id="as-agreement"
                  className={selectClass}
                  value={assignForm.agreementId}
                  onChange={(e) => setAssignForm({ ...assignForm, agreementId: e.target.value })}
                >
                  {activeAgreements.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.companyName ?? a.companyCode})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="as-router">Router</Label>
                <select
                  id="as-router"
                  className={selectClass}
                  value={assignForm.routerId}
                  onChange={(e) => setAssignForm({ ...assignForm, routerId: e.target.value })}
                >
                  <option value="">Select a router…</option>
                  {routers.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                {routers.length === 0 && (
                  <p className="text-xs text-muted-foreground">No router is listed for the selected company.</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="as-start">Owned from</Label>
                <Input
                  id="as-start"
                  type="date"
                  value={assignForm.start}
                  onChange={(e) => setAssignForm({ ...assignForm, start: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignForm(null)}>
              Cancel
            </Button>
            <Button onClick={saveAssignment} disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── month-end statements ─────────────────────────────────────── */}
      <Dialog open={billingPeriod !== null} onOpenChange={(open) => !open && setBillingPeriod(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Month-end statements</DialogTitle>
            <DialogDescription>
              Statements are made automatically on the 1st of each month. Use this to make them now for a month that has
              ended, for {companyCode ?? "the company you choose next"}. An agreement that already has a statement for the
              month is skipped.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="bill-period">Month</Label>
            <Input
              id="bill-period"
              type="month"
              value={billingPeriod ?? ""}
              onChange={(e) => setBillingPeriod(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBillingPeriod(null)}>
              Cancel
            </Button>
            <Button
              disabled={pending || !billingPeriod}
              onClick={() => {
                const period = billingPeriod;
                if (!period) return;
                requireCompany(() =>
                  startTransition(async () => {
                    const res = await runInvestorBillingAction(period);
                    if (!res.success || !res.data) {
                      toast.error(res.message || "Statements could not be made");
                      return;
                    }
                    toast.success(
                      `${res.data.statementsCreated} statement(s) made for ${res.data.period} (${res.data.agreements} agreement(s) checked)`
                    );
                    setBillingPeriod(null);
                  })
                );
              }}
            >
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Make statements
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
