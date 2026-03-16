"use client";

import { useState, useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import {
  Wifi, Plus, Pencil, Trash2, Zap, ArrowDown, ArrowUp,
  Clock, CheckCircle2, XCircle, Loader2, Package, ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { InternetPackage, PackagePayload, PackageUpdatePayload } from "@/actions/packages";
import {
  createPackageAction,
  updatePackageAction,
  deletePackageAction,
  deactivatePackageAction,
} from "@/actions/packages";

// ── Category config ────────────────────────────────────────────────────────────
const CATEGORY_STYLES: Record<string, string> = {
  Hourly:  "bg-primary/10 text-primary border-primary/20",
  Daily:   "bg-success/10 text-success border-success/20",
  Weekly:  "bg-warning/10 text-warning border-warning/20",
  Monthly: "bg-purple-100 text-purple-700 border-purple-200",
};
function getCategoryStyle(cat: string) {
  return CATEGORY_STYLES[cat] ?? "bg-muted text-muted-foreground border-border";
}

const CATEGORIES = ["All", "Hourly", "Daily", "Weekly", "Monthly"];
const VALIDITY_TYPES    = ["Min", "Hour", "Day", "Week", "Month"];
const PACKAGE_CATEGORIES = ["Hourly", "Daily", "Weekly", "Monthly", "Custom"];

// ── Validation ─────────────────────────────────────────────────────────────────
const validationSchema = Yup.object({
  packageName:     Yup.string().required("Package name is required"),
  price:           Yup.number().typeError("Price must be a number").min(0.01, "Price must be greater than 0").required("Price is required"),
  packageCategory: Yup.string().required("Category is required"),
  validityType:    Yup.string().required("Validity type is required"),
  validityValue:   Yup.number().typeError("Must be a number").min(1, "Must be at least 1").required("Validity value is required"),
  bandwidthType:   Yup.string().required("Bandwidth type is required"),
  speedDownload:   Yup.number().typeError("Must be a number").min(0, "Cannot be negative").required("Download speed is required"),
  speedUpload:     Yup.number().typeError("Must be a number").min(0, "Cannot be negative").required("Upload speed is required"),
  activeStatus:    Yup.boolean(),
  enableBurst:     Yup.boolean(),
  rateLimit:       Yup.string().when("enableBurst", { is: true, then: (s) => s.required("Rate limit is required") }),
  burstLimit:      Yup.string().when("enableBurst", { is: true, then: (s) => s.required("Burst limit is required") }),
  burstThreshold:  Yup.string().when("enableBurst", { is: true, then: (s) => s.required("Burst threshold is required") }),
  burstTime:       Yup.string().when("enableBurst", { is: true, then: (s) => s.required("Burst time is required") }),
});

const EMPTY_FORM = {
  packageName:     "",
  price:           "" as unknown as number,
  packageCategory: "",
  validityType:    "",
  validityValue:   "" as unknown as number,
  bandwidthType:   "",
  activeStatus:    true,
  speedDownload:   "" as unknown as number,
  speedUpload:     "" as unknown as number,
  enableBurst:     false,
  rateLimit:       "",
  burstLimit:      "",
  burstThreshold:  "",
  burstTime:       "",
};

// ── Field helpers ──────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-1">{msg}</p>;
}

function FormField({
  label, error, children, required,
}: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      <FieldError msg={error} />
    </div>
  );
}

// ── Package Sheet form ─────────────────────────────────────────────────────────
function PackageSheet({
  open, onClose, editing, username,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: InternetPackage | null;
  username: string;
  onSaved: (pkg: InternetPackage, isEdit: boolean) => void;
}) {
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: editing
      ? {
          packageName:     editing.packageName,
          price:           editing.price,
          packageCategory: editing.packageCategory,
          validityType:    editing.validityType,
          validityValue:   editing.validityValue,
          bandwidthType:   editing.bandwidthType,
          activeStatus:    editing.activeStatus,
          speedDownload:   editing.speedDownload,
          speedUpload:     editing.speedUpload,
          enableBurst:     editing.enableBurst,
          rateLimit:       editing.rateLimit ?? "",
          burstLimit:      editing.burstLimit ?? "",
          burstThreshold:  editing.burstThreshold ?? "",
          burstTime:       editing.burstTime ?? "",
        }
      : EMPTY_FORM,
    validationSchema,
    onSubmit: async (values, { setFieldError }) => {
      const payload: PackagePayload = {
        ...values,
        price:         Number(values.price),
        validityValue: Number(values.validityValue),
        speedDownload: Number(values.speedDownload),
        speedUpload:   Number(values.speedUpload),
        createdBy:     username,
      };

      const result = editing
        ? await updatePackageAction(editing.idxno, payload as PackageUpdatePayload)
        : await createPackageAction(payload);

      if (result.success && result.data) {
        toast.success(editing ? "Package updated" : "Package created");
        onSaved(result.data, !!editing);
        onClose();
      } else {
        // Map API field errors (e.g. { price: "Price must be greater than 0" })
        if (result.data && typeof result.data === "object") {
          Object.entries(result.data as unknown as Record<string, string>).forEach(([field, msg]) => {
            setFieldError(field, msg);
          });
        }
        toast.error(result.message ?? "Something went wrong");
      }
    },
  });

  const touched = formik.touched;
  const errors  = formik.errors;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-4">
        <SheetHeader className="pb-4">
          <SheetTitle>{editing ? "Edit Package" : "New Internet Package"}</SheetTitle>
          <SheetDescription>
            {editing ? "Update the package details below." : "Fill in the details to create a new package."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={formik.handleSubmit} noValidate className="space-y-6">

          {/* ── Section 1: Basic Info ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Basic Info</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <FormField label="Package Name" error={touched.packageName ? errors.packageName : undefined} required>
              <Input
                placeholder="e.g. Ksh 50 – 1 Hour"
                {...formik.getFieldProps("packageName")}
                className={cn(touched.packageName && errors.packageName ? "border-destructive" : "")}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Price (KSh)" error={touched.price ? errors.price : undefined} required>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  {...formik.getFieldProps("price")}
                  className={cn(touched.price && errors.price ? "border-destructive" : "")}
                />
              </FormField>

              <FormField label="Bandwidth Type" error={touched.bandwidthType ? errors.bandwidthType : undefined} required>
                <Input
                  placeholder="e.g. 5 mbs"
                  {...formik.getFieldProps("bandwidthType")}
                  className={cn(touched.bandwidthType && errors.bandwidthType ? "border-destructive" : "")}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Category" error={touched.packageCategory ? errors.packageCategory : undefined} required>
                <select
                  {...formik.getFieldProps("packageCategory")}
                  className={cn(
                    "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    touched.packageCategory && errors.packageCategory ? "border-destructive" : "border-input"
                  )}
                >
                  <option value="">Select…</option>
                  {PACKAGE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>

              <FormField label="Validity Type" error={touched.validityType ? errors.validityType : undefined} required>
                <select
                  {...formik.getFieldProps("validityType")}
                  className={cn(
                    "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    touched.validityType && errors.validityType ? "border-destructive" : "border-input"
                  )}
                >
                  <option value="">Select…</option>
                  {VALIDITY_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </FormField>
            </div>

            <FormField label="Validity Value" error={touched.validityValue ? errors.validityValue : undefined} required>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 60"
                {...formik.getFieldProps("validityValue")}
                className={cn(touched.validityValue && errors.validityValue ? "border-destructive" : "")}
              />
            </FormField>

            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Package available for sale</p>
              </div>
              <Switch
                checked={formik.values.activeStatus}
                onCheckedChange={(v) => formik.setFieldValue("activeStatus", v)}
              />
            </div>
          </div>

          {/* ── Section 2: Speed ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Speed</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Download (Mbps)" error={touched.speedDownload ? errors.speedDownload : undefined} required>
                <div className="relative">
                  <ArrowDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    {...formik.getFieldProps("speedDownload")}
                    className={cn("pl-8", touched.speedDownload && errors.speedDownload ? "border-destructive" : "")}
                  />
                </div>
              </FormField>

              <FormField label="Upload (Mbps)" error={touched.speedUpload ? errors.speedUpload : undefined} required>
                <div className="relative">
                  <ArrowUp className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    {...formik.getFieldProps("speedUpload")}
                    className={cn("pl-8", touched.speedUpload && errors.speedUpload ? "border-destructive" : "")}
                  />
                </div>
              </FormField>
            </div>
          </div>

          {/* ── Section 3: Burst Config ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Burst Configuration</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Enable Burst</p>
                <p className="text-xs text-muted-foreground">Allow temporary speed exceeding rate limit</p>
              </div>
              <Switch
                checked={formik.values.enableBurst}
                onCheckedChange={(v) => formik.setFieldValue("enableBurst", v)}
              />
            </div>

            <div className={cn("space-y-3 transition-opacity", !formik.values.enableBurst && "opacity-40 pointer-events-none")}>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Rate Limit" error={touched.rateLimit ? errors.rateLimit : undefined}>
                  <Input placeholder="e.g. 3" {...formik.getFieldProps("rateLimit")} className={cn(touched.rateLimit && errors.rateLimit ? "border-destructive" : "")} />
                </FormField>
                <FormField label="Burst Limit" error={touched.burstLimit ? errors.burstLimit : undefined}>
                  <Input placeholder="e.g. 4" {...formik.getFieldProps("burstLimit")} className={cn(touched.burstLimit && errors.burstLimit ? "border-destructive" : "")} />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Burst Threshold" error={touched.burstThreshold ? errors.burstThreshold : undefined}>
                  <Input placeholder="e.g. 4" {...formik.getFieldProps("burstThreshold")} className={cn(touched.burstThreshold && errors.burstThreshold ? "border-destructive" : "")} />
                </FormField>
                <FormField label="Burst Time" error={touched.burstTime ? errors.burstTime : undefined}>
                  <Input placeholder="e.g. 2" {...formik.getFieldProps("burstTime")} className={cn(touched.burstTime && errors.burstTime ? "border-destructive" : "")} />
                </FormField>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={formik.isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={formik.isSubmitting}>
              {formik.isSubmitting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : editing ? "Save Changes" : "Create Package"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ── Package Card ───────────────────────────────────────────────────────────────
function PackageCard({
  pkg,
  onEdit,
  onDelete,
  onToggleActive,
  deletingId,
  togglingId,
}: {
  pkg: InternetPackage;
  onEdit: (p: InternetPackage) => void;
  onDelete: (id: number) => void;
  onToggleActive: (p: InternetPackage) => void;
  deletingId: number | null;
  togglingId: number | null;
}) {
  const isDeleting  = deletingId  === pkg.idxno;
  const isToggling  = togglingId  === pkg.idxno;

  return (
    <div className={cn(
      "relative flex flex-col rounded-xl border bg-card overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
      !pkg.activeStatus && "opacity-60"
    )}>
      {/* Top accent strip */}
      <div className={cn(
        "h-1 w-full",
        pkg.activeStatus ? "bg-primary" : "bg-muted-foreground"
      )} />

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Header: name + category */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground leading-tight truncate">{pkg.packageName}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", getCategoryStyle(pkg.packageCategory))}>
                {pkg.packageCategory}
              </span>
              {pkg.enableBurst && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <Zap className="w-2.5 h-2.5" /> Burst
                </span>
              )}
            </div>
          </div>
          {/* Price hero */}
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-primary leading-none">
              {pkg.price.toLocaleString("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Validity */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>{pkg.validityValue} {pkg.validityType}</span>
          <span className="text-border">·</span>
          <span>{pkg.bandwidthType}</span>
        </div>

        {/* Speed */}
        <div className="flex items-center gap-4 rounded-lg bg-muted/50 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <ArrowDown className="w-3.5 h-3.5 text-success" />
            <span className="text-sm font-medium">{pkg.speedDownload} Mbps</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <ArrowUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-medium">{pkg.speedUpload} Mbps</span>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn("gap-1 text-xs", pkg.activeStatus ? "text-success border-success/30 bg-success/5" : "text-muted-foreground")}>
            {pkg.activeStatus
              ? <><CheckCircle2 className="w-3 h-3" /> Active</>
              : <><XCircle className="w-3 h-3" /> Inactive</>}
          </Badge>
          <Badge variant="outline" className={cn("gap-1 text-xs", pkg.isApproved ? "text-success border-success/30 bg-success/5" : "text-warning border-warning/30 bg-warning/5")}>
            {pkg.isApproved
              ? <><ShieldCheck className="w-3 h-3" /> Approved</>
              : <><AlertCircle className="w-3 h-3" /> Pending</>}
          </Badge>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center border-t border-border">
        <button
          onClick={() => onToggleActive(pkg)}
          disabled={isToggling || isDeleting}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
        >
          {isToggling
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : pkg.activeStatus
              ? <><XCircle className="w-3.5 h-3.5" /> Deactivate</>
              : <><CheckCircle2 className="w-3.5 h-3.5" /> Activate</>}
        </button>
        <div className="w-px h-6 bg-border" />
        <button
          onClick={() => onEdit(pkg)}
          disabled={isDeleting || isToggling}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
        <div className="w-px h-6 bg-border" />
        <button
          onClick={() => onDelete(pkg.idxno)}
          disabled={isDeleting || isToggling}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50"
        >
          {isDeleting
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <><Trash2 className="w-3.5 h-3.5" /> Delete</>}
        </button>
      </div>
    </div>
  );
}

// ── Main client component ──────────────────────────────────────────────────────
export default function PackagesClient({
  packages: initialPackages,
}: {
  packages: InternetPackage[];
}) {
  const [packages, setPackages]   = useState<InternetPackage[]>(initialPackages);
  const [activeCategory, setActiveCategory] = useState("All");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing]     = useState<InternetPackage | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Derive unique categories from data + fixed set
  const categories = useMemo(() => {
    const fromData = packages.map((p) => p.packageCategory).filter(Boolean);
    const unique   = Array.from(new Set([...CATEGORIES.slice(1), ...fromData]));
    return ["All", ...unique];
  }, [packages]);

  const filtered = useMemo(
    () => activeCategory === "All" ? packages : packages.filter((p) => p.packageCategory === activeCategory),
    [packages, activeCategory]
  );

  const activeCount = packages.filter((p) => p.activeStatus).length;

  function openAdd() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(pkg: InternetPackage) {
    setEditing(pkg);
    setSheetOpen(true);
  }

  function handleSaved(pkg: InternetPackage, isEdit: boolean) {
    setPackages((prev) =>
      isEdit ? prev.map((p) => p.idxno === pkg.idxno ? pkg : p) : [pkg, ...prev]
    );
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    const result = await deletePackageAction(id);
    setDeletingId(null);
    if (result.success) {
      setPackages((prev) => prev.filter((p) => p.idxno !== id));
      toast.success("Package deleted");
    } else {
      toast.error(result.message ?? "Failed to delete package");
    }
  }

  async function handleToggleActive(pkg: InternetPackage) {
    setTogglingId(pkg.idxno);
    let result;
    if (pkg.activeStatus) {
      result = await deactivatePackageAction(pkg.idxno);
    } else {
      result = await updatePackageAction(pkg.idxno, {
        packageName:     pkg.packageName,
        price:           pkg.price,
        packageCategory: pkg.packageCategory,
        validityType:    pkg.validityType,
        validityValue:   pkg.validityValue,
        bandwidthType:   pkg.bandwidthType,
        activeStatus:    true,
        speedDownload:   pkg.speedDownload,
        speedUpload:     pkg.speedUpload,
        enableBurst:     pkg.enableBurst,
        rateLimit:       pkg.rateLimit,
        burstLimit:      pkg.burstLimit,
        burstThreshold:  pkg.burstThreshold,
        burstTime:       pkg.burstTime,
        createdBy:       pkg.createdBy,
      });
    }
    setTogglingId(null);
    if (result.success && result.data) {
      setPackages((prev) => prev.map((p) => p.idxno === pkg.idxno ? result.data! : p));
      toast.success(pkg.activeStatus ? "Package deactivated" : "Package activated");
    } else {
      toast.error(result.message ?? "Failed to update package");
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Internet Packages</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {packages.length} package{packages.length !== 1 ? "s" : ""} &middot; {activeCount} active
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add Package
        </Button>
      </div>

      {/* ── Category filter ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all",
              activeCategory === cat
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            )}
          >
            {cat}
            {cat !== "All" && (
              <span className="ml-1.5 text-xs opacity-70">
                {packages.filter((p) => p.packageCategory === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Grid / Empty state ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">No packages found</p>
            <p className="text-sm text-muted-foreground">
              {activeCategory === "All"
                ? "Get started by creating your first internet package."
                : `No packages in the "${activeCategory}" category.`}
            </p>
          </div>
          {activeCategory === "All" && (
            <Button onClick={openAdd} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> Create Package
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((pkg) => (
            <PackageCard
              key={pkg.idxno}
              pkg={pkg}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              deletingId={deletingId}
              togglingId={togglingId}
            />
          ))}
        </div>
      )}

      {/* ── Sheet ── */}
      <PackageSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        editing={editing}
        username="admin"
        onSaved={handleSaved}
      />
    </div>
  );
}
