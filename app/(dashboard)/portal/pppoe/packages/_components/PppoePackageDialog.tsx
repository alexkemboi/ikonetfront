"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createPppoePackageAction,
  updatePppoePackageAction,
  type PppoePackage,
  type PppoePackageInput,
} from "@/actions/pppoe";
import { buildRateLimit, validatePppoePackageForm, type PppoePackageForm } from "@/lib/utils/pppoe-package";

function toForm(pkg: PppoePackage | null): PppoePackageForm {
  return {
    name: pkg?.name ?? "",
    downloadSpeed: pkg?.downloadSpeed != null ? String(pkg.downloadSpeed) : "",
    uploadSpeed: pkg?.uploadSpeed != null ? String(pkg.uploadSpeed) : "",
    durationDays: pkg?.durationDays != null ? String(pkg.durationDays) : "30",
    price: pkg?.price != null ? String(pkg.price) : "",
    dataCapGb: pkg?.dataCapMb ? String(pkg.dataCapMb / 1024) : "",
    maxDevices: pkg?.maxDevices != null ? String(pkg.maxDevices) : "1",
  };
}

export function PppoePackageDialog({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: PppoePackage | null;
  onClose: () => void;
  onSaved: (pkg: PppoePackage) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        {open && <PackageForm key={editing?.id ?? "new"} editing={editing} onClose={onClose} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  );
}

function PackageForm({
  editing,
  onClose,
  onSaved,
}: {
  editing: PppoePackage | null;
  onClose: () => void;
  onSaved: (pkg: PppoePackage) => void;
}) {
  const [form, setForm] = useState<PppoePackageForm>(() => toForm(editing));
  const [errors, setErrors] = useState<Partial<Record<keyof PppoePackageForm, string>>>({});
  const [saving, setSaving] = useState(false);

  function field(name: keyof PppoePackageForm) {
    return {
      id: `pppoe-pkg-${name}`,
      value: form[name],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [name]: e.target.value })),
      "aria-invalid": errors[name] ? true : undefined,
    };
  }

  // A limit set on the package (it may carry burst settings) is kept until the speeds change.
  const speedsChanged =
    !editing ||
    form.uploadSpeed.trim() !== String(editing.uploadSpeed ?? "") ||
    form.downloadSpeed.trim() !== String(editing.downloadSpeed ?? "");
  const rateLimit =
    !speedsChanged && editing?.mikrotikRateLimit
      ? editing.mikrotikRateLimit
      : buildRateLimit(form.uploadSpeed, form.downloadSpeed);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validatePppoePackageForm(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const input: PppoePackageInput = {
      name: form.name.trim(),
      downloadSpeed: Number(form.downloadSpeed),
      uploadSpeed: Number(form.uploadSpeed),
      durationDays: Number(form.durationDays),
      price: Number(form.price),
      mikrotikRateLimit: rateLimit ?? "",
      maxDevices: Number(form.maxDevices),
    };
    // A cap is only sent when one is set: an existing cap is not removed from here.
    if (form.dataCapGb.trim()) input.dataCapMb = Math.round(Number(form.dataCapGb) * 1024);

    setSaving(true);
    const res = editing ? await updatePppoePackageAction(editing.id, input) : await createPppoePackageAction(input);
    setSaving(false);
    if (!res.success || !res.data) {
      toast.error(editing ? "Could not update the package" : "Could not create the package", {
        description: res.message,
      });
      return;
    }
    toast.success(editing ? "Package updated" : "Package created", {
      description: editing
        ? "Customers already on it get the change at their next renewal."
        : "Assign it to customers from PPPoE Clients.",
    });
    onSaved(res.data);
    onClose();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <DialogHeader>
        <DialogTitle>{editing ? "Edit PPPoE package" : "New PPPoE package"}</DialogTitle>
        <DialogDescription>
          The speed, period and price a PPPoE customer is put on. An M-Pesa payment of at least the price renews
          one period.
        </DialogDescription>
      </DialogHeader>

      <Field label="Package name" error={errors.name}>
        <Input placeholder="e.g. Home 10 Mbps" {...field("name")} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Download (Mbps)" error={errors.downloadSpeed}>
          <Input inputMode="numeric" placeholder="10" {...field("downloadSpeed")} />
        </Field>
        <Field label="Upload (Mbps)" error={errors.uploadSpeed}>
          <Input inputMode="numeric" placeholder="10" {...field("uploadSpeed")} />
        </Field>
        <Field label="Period (days)" error={errors.durationDays}>
          <Input inputMode="numeric" placeholder="30" {...field("durationDays")} />
        </Field>
        <Field label="Price (KES)" error={errors.price}>
          <Input inputMode="decimal" placeholder="2500" {...field("price")} />
        </Field>
        <Field label="Data cap (GB)" error={errors.dataCapGb} hint="Leave empty for unlimited.">
          <Input inputMode="decimal" placeholder="Unlimited" {...field("dataCapGb")} />
        </Field>
        <Field label="Devices at once" error={errors.maxDevices}>
          <Input inputMode="numeric" placeholder="1" {...field("maxDevices")} />
        </Field>
      </div>

      <p className="rounded-md border border-border bg-muted/40 p-2 text-xs text-muted-foreground">
        Router speed limit: <span className="font-medium text-foreground tabular-nums">{rateLimit ?? "—"}</span>{" "}
        (upload/download)
      </p>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {editing ? "Save changes" : "Create package"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactElement<{ id?: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={children.props.id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
