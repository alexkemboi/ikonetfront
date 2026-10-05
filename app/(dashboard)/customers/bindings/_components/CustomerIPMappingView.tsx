"use client";

import { useCompanyScope } from "@/providers/CompanyScopeProvider";
import { useState, useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/providers/PermissionsProvider";
import { Input } from "@/components/ui/input";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import {
 Sheet,
 SheetContent,
 SheetDescription,
 SheetHeader,
 SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { createIpMappingAction } from "@/actions/network";
import {
 Network,
 Router,
 User,
 Search,
 ChevronRight,
 Wifi,
 WifiOff,
 Clock,
 Bookmark,
 Layers,
 Plus,
 Loader2,
 CheckCircle2,
} from "lucide-react";
import type { IPMapping, IPPool, CustomerOption, PackageOption } from "../page";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
 MoreHorizontal,
 Pencil,
 Trash2,
 Eye,
 Copy,
 Ban,
 RotateCcw,
} from "lucide-react";
interface Props {
 mappings: IPMapping[];
 pools: IPPool[];
 customers: CustomerOption[];
 packages: PackageOption[];
}

// ── Validation ────────────────────────────────────────────────────────────────

const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const MAC_REGEX = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

const MappingSchema = Yup.object({
 customerId: Yup.string().required("Select a customer"),
 ipAddress: Yup.string().matches(IP_REGEX, "Enter a valid IP (e.g. 192.168.10.50)").required("IP address is required"),
 macAddress: Yup.string().matches(MAC_REGEX, "Enter a valid MAC (e.g. AA:BB:CC:DD:EE:FF)").required("MAC address is required"),
 routerId: Yup.string().required("Select a router"),
 packageId: Yup.string().required("Select a package"),
 leaseStart: Yup.string().required("Lease start date is required"),
 leaseExpiry: Yup.string().required("Lease expiry date is required"),
 status: Yup.string().oneOf(["active", "reserved"]).required(),
});

type FormValues = {
 customerId: string;
 ipAddress: string;
 macAddress: string;
 routerId: string;
 packageId: string;
 leaseStart: string;
 leaseExpiry: string;
 status: "active" | "reserved";
};

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
 if (!msg) return null;
 return <p className="text-xs text-destructive mt-1">{msg}</p>;
}

function StatusBadge({ status }: { status: IPMapping["status"] }) {
  if (status === "ONLINE")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        Active
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
      <WifiOff className="w-3 h-3" />
      Expired
    </span>
  );
}

function PoolBar({ pool }: { pool: IPPool }) {
  const total = pool.totalIps || 1;
  const used = pool.usedIps || 0;
  const free = Math.max(0, pool.availableIps || 0);
  const usedPct = Math.min(100, Math.round((pool.utilizationPercentage ?? (used / total) * 100)));
  const reservedPct = 0;
  const color =
    usedPct > 85
      ? "bg-destructive"
      : usedPct > 60
      ? "bg-warning"
      : "bg-success";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <Router className="w-3.5 h-3.5 text-muted-foreground" />
          {pool.poolName}
        </div>
        <span className="text-muted-foreground font-sans tabular-nums text-[11px]">{pool.subnet}</span>
      </div>
      <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
        <div className={`absolute left-0 top-0 h-full rounded-full transition-all ${color}`} style={{ width: `${usedPct}%` }} />
        <div className="absolute top-0 h-full bg-primary opacity-60" style={{ left: `${usedPct}%`, width: `${reservedPct}%` }} />
      </div>
      <div className="flex gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block" />{used} used</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/30 inline-block" />{free} free</span>
        <span className="ml-auto font-sans tabular-nums">{usedPct}%</span>
      </div>
    </div>
  );
}

function MappingRow({ m }: { m: IPMapping }) {
  const perms = usePermissions("/network/ip-mapping");
  return (
    <div className="group grid grid-cols-[1fr_auto_1fr_auto_1fr_120px_100px] items-center gap-2 px-4 py-3 rounded-lg border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{m.username}</p>
          <p className="text-[11px] text-muted-foreground truncate">{m.macAddress || "—"}</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
      <div className="min-w-0">
        <p className="font-sans tabular-nums text-sm font-semibold text-foreground tracking-tight">{m.ipAddress}</p>
        <p className="font-sans tabular-nums text-[11px] text-muted-foreground tracking-wide">
          {m.macAddress && m.macAddress !== "00:00:00:00:00:00" ? m.macAddress : "—"}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Router className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{m.stationName}</p>
          <p className="text-[11px] text-muted-foreground truncate">{m.lastSeen ? new Date(m.lastSeen).toLocaleString() : "—"}</p>
        </div>
      </div>
      <div className="text-center">
        <Badge variant={m.serviceType === "PPPOE" ? "default" : "outline"} className="text-[11px]">
          {m.serviceType === "PPPOE" ? "PPPoE" : "Hotspot"}
        </Badge>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">—</p>
      </div>
      <div className="flex justify-end">
       <div className="flex items-center justify-end gap-2">
  <StatusBadge status={m.status} />

 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8 rounded-lg\n text-muted-foreground\n hover:bg-muted\n hover:text-foreground\n transition-colors"
 >
 <MoreHorizontal className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>

 <DropdownMenuContent
 align="end"
 className="w-48"
 >
 <DropdownMenuItem className="gap-2">
 <Eye className="h-4 w-4" />
 View Mapping
 </DropdownMenuItem>

 {perms.canEdit && (
 <DropdownMenuItem className="gap-2">
 <Pencil className="h-4 w-4" />
 Edit Mapping
 </DropdownMenuItem>
 )}

 <DropdownMenuItem className="gap-2">
 <Copy className="h-4 w-4" />
 Copy IP Address
 </DropdownMenuItem>

{perms.canEdit && (
            <>
              <DropdownMenuSeparator />
              {m.status === "ONLINE" ? (
                <DropdownMenuItem className="gap-2 text-amber-600">
                  <Ban className="h-4 w-4" />
                  Suspend Lease
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="gap-2 text-emerald-600">
                  <RotateCcw className="h-4 w-4" />
                  Restore Lease
                </DropdownMenuItem>
              )}
            </>
          )}

 {perms.canDelete && (
 <DropdownMenuItem className="gap-2 text-red-600">
 <Trash2 className="h-4 w-4" />
 Delete Mapping
 </DropdownMenuItem>
 )}
 </DropdownMenuContent>
 </DropdownMenu>
</div>
 </div>
 </div>
 );
}

// ── Map IP Sheet ──────────────────────────────────────────────────────────────

function MapIPSheet({
 open,
 onClose,
 customers,
 packages,
 pools,
}: {
 open: boolean;
 onClose: () => void;
 customers: CustomerOption[];
 packages: PackageOption[];
 pools: IPPool[];
}) {
 const [success, setSuccess] = useState(false);
 const [error, setError] = useState("");

 const formik = useFormik<FormValues>({
 initialValues: {
 customerId: "",
 ipAddress: "",
 macAddress: "",
 routerId: "",
 packageId: "",
 leaseStart: "",
 leaseExpiry: "",
 status: "active",
 },
 validationSchema: MappingSchema,
 onSubmit: async (values, { resetForm, setSubmitting }) => {
 setSubmitting(true);
 setError("");
 const res = await createIpMappingAction({
 customerId: values.customerId,
 macAddress: values.macAddress,
 ipAddress: values.ipAddress,
 });
 setSubmitting(false);
 if (res.success) {
 setSuccess(true);
 setTimeout(() => {
 setSuccess(false);
 resetForm();
 onClose();
 }, 1500);
 } else {
 setError(res.message);
 }
 },
 });

 const selectedCustomer = customers.find((c) => c.id === formik.values.customerId);
 const filteredPackages = selectedCustomer
 ? packages.filter((p) => p.custType === selectedCustomer.custType)
 : packages;

 // Reset packageId when customer changes and the current package no longer matches
 function handleCustomerChange(id: string) {
 formik.setFieldValue("customerId", id);
 formik.setFieldValue("packageId", "");
 }

 function handleClose() {
 formik.resetForm();
 setSuccess(false);
 onClose();
 }

 return (
 <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
 <SheetContent className="w-120 sm:max-w-120 overflow-y-auto p-4">
 <SheetHeader className="pb-4">
 <SheetTitle className="flex items-center gap-2">
 <Network className="w-5 h-5 text-primary" />
 Map New IP Address
 </SheetTitle>
 <SheetDescription>
 Assign an IP address to a customer and bind it to a router.
 </SheetDescription>
 </SheetHeader>

{success ? (
  <div className="flex flex-col items-center justify-center py-16 space-y-3">
  <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
  <CheckCircle2 className="w-7 h-7 text-success" />
  </div>
 <p className="text-sm font-semibold text-foreground">Mapping created</p>
 <p className="text-xs text-muted-foreground">Closing…</p>
 </div>
 ) : (
 <form onSubmit={formik.handleSubmit} className="space-y-5 pt-2">
 {/* ── Customer ── */}
 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
 Customer
 </label>
 <Select
 value={formik.values.customerId}
 onValueChange={handleCustomerChange}
 >
 <SelectTrigger className={formik.touched.customerId && formik.errors.customerId ? "border-destructive" : ""}>
 <SelectValue placeholder="Select a customer" />
 </SelectTrigger>
 <SelectContent>
 {customers.map((c) => (
 <SelectItem key={c.id} value={c.id}>
 <div className="flex items-center gap-2">
 <span>{c.name}</span>
 <span className="text-xs text-muted-foreground">({c.custType.toUpperCase()})</span>
 </div>
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 {selectedCustomer && (
 <p className="text-[11px] text-muted-foreground">{selectedCustomer.email}</p>
 )}
 <FieldError msg={formik.touched.customerId ? formik.errors.customerId : undefined} />
 </div>

 <Separator />

 {/* ── Network details ── */}
 <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
 Network Details
 </p>

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-foreground">IP Address</label>
 <Input
 name="ipAddress"
 placeholder="e.g. 192.168.10.50"
 value={formik.values.ipAddress}
 onChange={formik.handleChange}
 onBlur={formik.handleBlur}
 className={`font-sans tabular-nums ${formik.touched.ipAddress && formik.errors.ipAddress ? "border-destructive" : ""}`}
 />
 <FieldError msg={formik.touched.ipAddress ? formik.errors.ipAddress : undefined} />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-foreground">MAC Address</label>
 <Input
 name="macAddress"
 placeholder="e.g. AA:BB:CC:DD:EE:FF"
 value={formik.values.macAddress}
 onChange={(e) => formik.setFieldValue("macAddress", e.target.value.toUpperCase())}
 onBlur={formik.handleBlur}
 className={`font-sans tabular-nums ${formik.touched.macAddress && formik.errors.macAddress ? "border-destructive" : ""}`}
 />
 <FieldError msg={formik.touched.macAddress ? formik.errors.macAddress : undefined} />
 </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Router</label>
              <Select
                value={formik.values.routerId}
                onValueChange={(v) => formik.setFieldValue("routerId", v)}
              >
                <SelectTrigger className={formik.touched.routerId && formik.errors.routerId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select a router" />
                </SelectTrigger>
                <SelectContent>
                  {pools.map((p) => (
                    <SelectItem key={p.poolName} value={p.poolName}>
                      <div className="flex items-center gap-2">
                        <Router className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{p.poolName}</span>
                        <span className="text-xs text-muted-foreground">— {p.subnet}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError msg={formik.touched.routerId ? formik.errors.routerId : undefined} />
            </div>

 <Separator />

 {/* ── Subscription ── */}
 <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
 Subscription
 </p>

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-foreground">Package</label>
 <Select
 value={formik.values.packageId}
 onValueChange={(v) => formik.setFieldValue("packageId", v)}
 disabled={!formik.values.customerId}
 >
 <SelectTrigger className={formik.touched.packageId && formik.errors.packageId ? "border-destructive" : ""}>
 <SelectValue placeholder={formik.values.customerId ? "Select a package" : "Select a customer first"} />
 </SelectTrigger>
 <SelectContent>
 {filteredPackages.map((p) => (
 <SelectItem key={p.id} value={p.id}>
 {p.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 <FieldError msg={formik.touched.packageId ? formik.errors.packageId : undefined} />
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-foreground">Lease Start</label>
 <Input
 type="date"
 name="leaseStart"
 value={formik.values.leaseStart}
 onChange={formik.handleChange}
 onBlur={formik.handleBlur}
 className={formik.touched.leaseStart && formik.errors.leaseStart ? "border-destructive" : ""}
 />
 <FieldError msg={formik.touched.leaseStart ? formik.errors.leaseStart : undefined} />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-foreground">Lease Expiry</label>
 <Input
 type="date"
 name="leaseExpiry"
 value={formik.values.leaseExpiry}
 onChange={formik.handleChange}
 onBlur={formik.handleBlur}
 className={formik.touched.leaseExpiry && formik.errors.leaseExpiry ? "border-destructive" : ""}
 />
 <FieldError msg={formik.touched.leaseExpiry ? formik.errors.leaseExpiry : undefined} />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-foreground">Initial Status</label>
 <Select
 value={formik.values.status}
 onValueChange={(v) => formik.setFieldValue("status", v)}
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="active">Active — customer can use this IP immediately</SelectItem>
 <SelectItem value="reserved">Reserved — hold this IP without assigning yet</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {error && (
 <p className="text-xs text-destructive">{error}</p>
 )}

 <div className="flex gap-3 pt-2">
 <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
 Cancel
 </Button>
 <Button type="submit" className="flex-1" disabled={formik.isSubmitting}>
 {formik.isSubmitting ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin mr-2" />
 Saving…
 </>
 ) : (
 <>
 <Network className="w-4 h-4 mr-2" />
 Create Mapping
 </>
 )}
 </Button>
 </div>
 </form>
 )}
 </SheetContent>
 </Sheet>
 );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function CustomerIPMappingView({ mappings, pools, customers, packages }: Props) {
 const [search, setSearch] = useState("");
 const [routerFilter, setRouterFilter] = useState("all");
 const [statusFilter, setStatusFilter] = useState("all");
 const [sheetOpen, setSheetOpen] = useState(false);
 const perms = usePermissions("/network/ip-mapping");
 const { requireCompany } = useCompanyScope();

  const routers = useMemo(
    () => Array.from(new Set(mappings.map((m) => m.stationName))),
    [mappings]
  );

  const filtered = useMemo(
    () =>
      mappings.filter((m) => {
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          m.username.toLowerCase().includes(q) ||
          m.ipAddress.includes(q) ||
          m.macAddress.toLowerCase().includes(q) ||
          m.stationName.toLowerCase().includes(q);
        const matchRouter = routerFilter === "all" || m.stationName === routerFilter;
        const matchStatus = statusFilter === "all" || m.status === statusFilter;
        return matchSearch && matchRouter && matchStatus;
      }),
    [mappings, search, routerFilter, statusFilter]
  );

  const stats = useMemo(() => {
    const total    = mappings.length;
    const active   = mappings.filter((m) => m.status === "ONLINE").length;
    const expired  = mappings.filter((m) => m.status === "EXPIRED").length;
    const available = pools.reduce((s, p) => s + (p.availableIps || 0), 0);
    return { total, active, expired, available };
  }, [mappings, pools]);

  const totalIPs  = pools.reduce((s, p) => s + (p.totalIps || 0), 0);
  const totalUsed = pools.reduce((s, p) => s + (p.usedIps || 0), 0);

 return (
 <div className="space-y-6">
{/* Header */}
  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <p className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
        Customers — Bindings
      </p>
      <h1 className="text-3xl font-sans font-normal text-foreground">Customer IP Bindings.</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Track which customer owns which IP across all routers
      </p>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="gap-1.5">
        <Layers className="w-4 h-4" />
        Export
      </Button>
      {perms.canCreate && (
        <Button
          size="sm"
          className="gap-1.5 rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
          onClick={() => requireCompany(() => setSheetOpen(true))}
        >
          <Plus className="w-4 h-4" />
          Map IP
        </Button>
      )}
    </div>
  </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Leases", value: stats.total,    icon: Network,   color: "text-primary bg-primary/10" },
          { label: "Active",       value: stats.active,   icon: Wifi,      color: "text-success bg-success/10" },
          { label: "Expired",      value: stats.expired,  icon: WifiOff,   color: "text-warning bg-warning/10" },
          { label: "Available IPs", value: stats.available, icon: Bookmark, color: "text-muted-foreground bg-muted" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-6 items-start">
        {/* Main mapping list */}
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search customer, IP, MAC..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={routerFilter} onValueChange={setRouterFilter}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue placeholder="All Routers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Routers</SelectItem>
                {routers.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ONLINE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

 {/* Column header */}
 <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_120px_100px] items-center gap-2 px-4 py-2 rounded-lg bg-muted/40">
 <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
 <User className="w-3 h-3" /> Customer
 </span>
 <span />
 <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
 <Network className="w-3 h-3" /> IP / MAC
 </span>
 <span />
 <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
 <Router className="w-3 h-3" /> Router
 </span>
 <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-center">Package</span>
 <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-right">


 <div className="flex items-center justify-between">
 <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
 Status
 </span>

 <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-right pr-2">
 Actions
 </span>
</div>
 </span>
 </div>

 {/* Rows */}
 <div className="space-y-2">
 {filtered.length === 0 ? (
 <div className="text-center py-12 text-sm text-muted-foreground">
 No mappings match your filters.
 </div>
 ) : (
 filtered.map((m) => <MappingRow key={m.id} m={m} />)
 )}
 </div>
 <p className="text-xs text-muted-foreground px-1">
 {filtered.length} of {mappings.length} leases shown
 </p>
 </div>

        {/* Pool sidebar */}
        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-muted-foreground" />
                IP Pool Utilization
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {totalUsed} of {totalIPs} addresses assigned across {pools.length} routers
              </p>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-5">
              {pools.map((pool) => (
                <PoolBar key={pool.poolName} pool={pool} />
              ))}
            </CardContent>
          </Card>

 <Card className="border-border bg-muted/20">
 <CardContent className="p-4 space-y-2">
 <div className="flex items-center gap-2 text-xs text-muted-foreground">
 <Clock className="w-3.5 h-3.5" />
 <span className="font-medium">How this works</span>
 </div>
 <p className="text-xs text-muted-foreground leading-relaxed">
 Each IP lease binds a customer&apos;s device (by MAC address) to a specific router.
 PPPoE leases are long-lived; hotspot leases expire after the purchased session ends.
 </p>
 </CardContent>
 </Card>
 </div>
 </div>

 {/* Map IP Sheet */}
 <MapIPSheet
 open={sheetOpen}
 onClose={() => setSheetOpen(false)}
 customers={customers}
 packages={packages}
 pools={pools}
 />
 </div>
 );
}
