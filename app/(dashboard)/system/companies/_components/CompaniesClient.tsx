"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Building2, Loader2, Plus, ShieldAlert } from "lucide-react";
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
  type CompanySummary,
  type PaymentAccountPayload,
} from "@/actions/companies";

type Props = {
  companies: CompanySummary[];
  canMutate: boolean;
};

export default function CompaniesClient({ companies, canMutate }: Props) {
  const [rows, setRows] = useState<CompanySummary[]>(companies);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [accountFor, setAccountFor] = useState<CompanySummary | null>(null);

  // New-company form
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");

  // Payment-account form
  const [accountType, setAccountType] = useState<"PAYBILL" | "TILL" | "BANK">("PAYBILL");
  const [shortCode, setShortCode] = useState("");
  const [tillNumber, setTillNumber] = useState("");
  const [clientKey, setClientKey] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [isDefault, setIsDefault] = useState(false);

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
    setIsDefault(false);
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
    const payload: PaymentAccountPayload = {
      accountType,
      shortCode: shortCode.trim(),
      tillNumber: accountType === "TILL" ? tillNumber.trim() : undefined,
      clientKey: clientKey.trim() || undefined,
      clientSecret: clientSecret.trim() || undefined,
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No companies found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((company) => (
                  <TableRow key={company.code}>
                    <TableCell className="font-mono text-xs font-medium">{company.code}</TableCell>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell className="text-muted-foreground">{company.alias}</TableCell>
                    <TableCell className="text-right">
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
    </div>
  );
}