"use client";

import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import {
  Plus, Mail, MessageSquare, Bell, Smartphone, Pencil,
  Trash2, Loader2, Power, AlertTriangle, CreditCard, Megaphone, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/providers/PermissionsProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  createProviderAction,
  updateProviderAction,
  deleteProviderAction,
  type AlertProvider,
  type AlertProviderPayload,
} from "@/actions/alerts";
import type { LucideIcon } from "lucide-react";

// ── Channel definitions ─────────────────────────────────────────────────
type ChannelDef = {
  id:           string;
  label:        string;
  icon:         LucideIcon;
  description:  string;
  color:        string;
  bg:           string;
  activeBorder: string;
  activeBg:     string;
};

const CHANNELS: ChannelDef[] = [
  { id: "EMAIL",    label: "Email",             icon: Mail,          description: "Send alerts via SMTP or transactional email API", color: "text-primary",  bg: "bg-primary/10",  activeBorder: "border-primary",  activeBg: "bg-primary/5"  },
  { id: "SMS",      label: "SMS",               icon: MessageSquare, description: "Send alerts via SMS gateway to phone numbers",     color: "text-success",  bg: "bg-success/10",  activeBorder: "border-success",  activeBg: "bg-success/5"  },
  { id: "WHATSAPP", label: "WhatsApp",           icon: Smartphone,    description: "Send alerts via WhatsApp Business API",            color: "text-success",  bg: "bg-success/10",  activeBorder: "border-success",  activeBg: "bg-success/5"  },
  { id: "PUSH",     label: "Push Notification",  icon: Bell,          description: "Send real-time push notifications to devices",     color: "text-warning",  bg: "bg-warning/10",  activeBorder: "border-warning",  activeBg: "bg-warning/5"  },
];

const CHANNEL_LABELS: Record<string, string> = {
  EMAIL: "Email", SMS: "SMS", WHATSAPP: "WhatsApp", PUSH: "Push",
};

// ── Notification message categories ────────────────────────────────────────
type NotifCategory = {
  id:          string;
  label:       string;
  description: string;
  icon:        LucideIcon;
  color:       string;
  bg:          string;
  border:      string;
  optIn:       boolean;
};

const NOTIF_CATEGORIES: NotifCategory[] = [
  {
    id:          "alerts",
    label:       "Service Alerts",
    description: "Outages, expiry warnings, suspension notices, and service status changes. Always sent.",
    icon:        AlertTriangle,
    color:       "text-destructive",
    bg:          "bg-destructive/10",
    border:      "border-destructive/30",
    optIn:       false,
  },
  {
    id:          "transactions",
    label:       "Transaction Notifications",
    description: "Payment receipts, M-Pesa confirmations, and renewal confirmations. Always sent.",
    icon:        CreditCard,
    color:       "text-success",
    bg:          "bg-success/10",
    border:      "border-success/30",
    optIn:       false,
  },
  {
    id:          "promotions",
    label:       "Promotions & Offers",
    description: "New packages, discounts, referral bonuses, and seasonal offers. Customers can opt out.",
    icon:        Megaphone,
    color:       "text-warning",
    bg:          "bg-warning/10",
    border:      "border-warning/30",
    optIn:       true,
  },
  {
    id:          "system",
    label:       "System Updates",
    description: "Scheduled maintenance, network upgrades, and platform announcements. Always sent.",
    icon:        Info,
    color:       "text-primary",
    bg:          "bg-primary/10",
    border:      "border-primary/30",
    optIn:       false,
  },
];

// ── Notification category toggle card ──────────────────────────────────────
function NotifCategoryCard({
  cat,
  enabled,
  onToggle,
}: {
  cat:      NotifCategory;
  enabled:  boolean;
  onToggle: (id: string) => void;
}) {
  const Icon = cat.icon;
  return (
    <div
      className={cn(
        "relative rounded-xl border-2 p-4 transition-all duration-200",
        enabled ? `${cat.border} bg-card` : "border-border bg-card opacity-70"
      )}
    >
      {cat.optIn && (
        <span className="absolute top-3 right-3 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/20">
          Opt-in
        </span>
      )}
      <div className="flex items-start gap-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5", cat.bg)}>
          <Icon className={cn("w-4 h-4", cat.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">{cat.label}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{cat.description}</p>
          {!cat.optIn && (
            <p className="text-[10px] text-muted-foreground mt-2 italic">Cannot be disabled</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => cat.optIn && onToggle(cat.id)}
          disabled={!cat.optIn}
          aria-label={enabled ? "Disable" : "Enable"}
          className={cn(
            "relative w-10 h-5 rounded-full transition-colors shrink-0 mt-1",
            !cat.optIn && "cursor-not-allowed opacity-60",
            enabled ? "bg-success" : "bg-muted-foreground/30"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
              enabled && "translate-x-5"
            )}
          />
        </button>
      </div>
    </div>
  );
}

// ── Validation schema ───────────────────────────────────────────────────
const providerSchema = Yup.object({
  channel:      Yup.string().required("Channel is required"),
  providerName: Yup.string().required("Provider name is required"),
  apiUrl:       Yup.string().required("API URL / SMTP host is required"),
  apiKey:       Yup.string().required("API key / email is required"),
  apiSecret:    Yup.string().required("API secret / password is required"),
  senderId:     Yup.string().required("Sender ID / port is required"),
  fromEmail:    Yup.string().email("Must be a valid email").required("From email is required"),
  fromName:     Yup.string().required("From name is required"),
  isActive:     Yup.boolean(),
});

type ProviderFormValues = Yup.InferType<typeof providerSchema>;

const EMPTY_FORM: ProviderFormValues = {
  channel: "EMAIL", providerName: "", apiUrl: "", apiKey: "",
  apiSecret: "", senderId: "", fromEmail: "", fromName: "", isActive: true,
};

// ── Add / Edit Provider Sheet ───────────────────────────────────────────
function ProviderSheet({
  open, onClose, editing, onSaved,
}: {
  open:    boolean;
  onClose: () => void;
  editing: AlertProvider | null;
  onSaved: (provider: AlertProvider, isNew: boolean) => void;
}) {
  const formik = useFormik<ProviderFormValues>({
    initialValues: editing
      ? { channel: editing.channel, providerName: editing.providerName, apiUrl: editing.apiUrl, apiKey: editing.apiKey, apiSecret: "", senderId: editing.senderId, fromEmail: editing.fromEmail, fromName: editing.fromName, isActive: editing.isActive }
      : EMPTY_FORM,
    enableReinitialize: true,
    validationSchema:   providerSchema,
    onSubmit: async (values, helpers) => {
      const payload: AlertProviderPayload = {
        channel:      values.channel,
        providerName: values.providerName,
        apiUrl:       values.apiUrl,
        apiKey:       values.apiKey,
        apiSecret:    values.apiSecret,
        senderId:     values.senderId,
        fromEmail:    values.fromEmail,
        fromName:     values.fromName,
        isActive:     values.isActive ?? true,
      };

      const result = editing
        ? await updateProviderAction(editing.idxno, payload)
        : await createProviderAction(payload);

      if (result.success) {
        toast.success(editing ? "Provider updated" : "Provider added", {
          description: `${values.providerName} (${values.channel}) saved successfully.`,
        });
        onSaved(result.data as AlertProvider, !editing);
        helpers.resetForm();
        onClose();
      } else {
        toast.error("Failed to save provider", { description: result.message });
      }
    },
  });

  function handleClose() { formik.resetForm(); onClose(); }
  const { errors: err, touched } = formik;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <SheetTitle>{editing ? "Edit Provider" : "Add Alert Provider"}</SheetTitle>
          <SheetDescription>
            Configure a notification channel provider. Credentials are stored securely.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={formik.handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Channel selector */}
            <div className="space-y-2">
              <Label>Channel</Label>
              <div className="grid grid-cols-2 gap-2">
                {CHANNELS.map((ch) => {
                  const Icon     = ch.icon;
                  const selected = formik.values.channel === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => formik.setFieldValue("channel", ch.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                        selected
                          ? `${ch.activeBorder} ${ch.activeBg} ${ch.color}`
                          : "border-border text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {ch.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Provider Name */}
            <div className="space-y-2">
              <Label htmlFor="providerName">Provider Name</Label>
              <Input id="providerName" placeholder="e.g. Gmail, Africa's Talking" {...formik.getFieldProps("providerName")} className={cn(touched.providerName && err.providerName && "border-danger")} />
              {touched.providerName && err.providerName && <p className="text-xs text-danger">{err.providerName}</p>}
            </div>

            {/* API URL */}
            <div className="space-y-2">
              <Label htmlFor="apiUrl">API URL / SMTP Host</Label>
              <Input id="apiUrl" placeholder="e.g. smtp.gmail.com" {...formik.getFieldProps("apiUrl")} className={cn(touched.apiUrl && err.apiUrl && "border-danger")} />
              {touched.apiUrl && err.apiUrl && <p className="text-xs text-danger">{err.apiUrl}</p>}
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key / Email</Label>
              <Input id="apiKey" placeholder="e.g. you@example.com or API key" {...formik.getFieldProps("apiKey")} className={cn(touched.apiKey && err.apiKey && "border-danger")} />
              {touched.apiKey && err.apiKey && <p className="text-xs text-danger">{err.apiKey}</p>}
            </div>

            {/* API Secret */}
            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret / App Password</Label>
              <Input id="apiSecret" type="password" placeholder="••••••••••••" {...formik.getFieldProps("apiSecret")} className={cn(touched.apiSecret && err.apiSecret && "border-danger")} />
              {touched.apiSecret && err.apiSecret && <p className="text-xs text-danger">{err.apiSecret}</p>}
            </div>

            {/* Sender ID + From Email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="senderId">Sender ID / Port</Label>
                <Input id="senderId" placeholder="e.g. 587" {...formik.getFieldProps("senderId")} className={cn(touched.senderId && err.senderId && "border-danger")} />
                {touched.senderId && err.senderId && <p className="text-xs text-danger">{err.senderId}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email</Label>
                <Input id="fromEmail" placeholder="alerts@example.com" {...formik.getFieldProps("fromEmail")} className={cn(touched.fromEmail && err.fromEmail && "border-danger")} />
                {touched.fromEmail && err.fromEmail && <p className="text-xs text-danger">{err.fromEmail}</p>}
              </div>
            </div>

            {/* From Name */}
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input id="fromName" placeholder="e.g. IBS System" {...formik.getFieldProps("fromName")} className={cn(touched.fromName && err.fromName && "border-danger")} />
              {touched.fromName && err.fromName && <p className="text-xs text-danger">{err.fromName}</p>}
            </div>

            {/* Is Active toggle */}
            <div className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Active</p>
                <p className="text-xs text-muted-foreground">Enable this provider immediately after saving</p>
              </div>
              <button
                type="button"
                onClick={() => formik.setFieldValue("isActive", !formik.values.isActive)}
                className={cn("relative w-10 h-5 rounded-full transition-colors shrink-0", formik.values.isActive ? "bg-success" : "bg-muted-foreground/30")}
              >
                <span className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", formik.values.isActive && "translate-x-5")} />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-6 py-4 border-t border-border flex gap-3">
            <Button type="submit" className="flex-1" disabled={formik.isSubmitting}>
              {formik.isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</>
                : editing ? "Update Provider" : "Add Provider"
              }
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} disabled={formik.isSubmitting}>Cancel</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ── Main component ──────────────────────────────────────────────────────
export default function AlertsClient({
  providers: initialProviders,
  activeChannels: initialActiveChannels,
}: {
  providers:      AlertProvider[];
  activeChannels: string[];
}) {
  const [providers, setProviders]           = useState(initialProviders);
  const [activeChannels, setActiveChannels] = useState<string[]>(initialActiveChannels);
  const [sheetOpen, setSheetOpen]           = useState(false);
  const [editing, setEditing]               = useState<AlertProvider | null>(null);
  const [deletingId, setDeletingId]         = useState<number | null>(null);
  const [togglingId, setTogglingId]         = useState<number | null>(null);
  const perms = usePermissions("/settings/alerts");
  const [enabledCategories, setEnabledCategories] = useState<string[]>(
    NOTIF_CATEGORIES.map((c) => c.id)
  );

  function toggleCategory(id: string) {
    setEnabledCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function toggleChannel(id: string) {
    setActiveChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function handleEdit(provider: AlertProvider) {
    setEditing(provider);
    setSheetOpen(true);
  }

  function handleAdd() {
    setEditing(null);
    setSheetOpen(true);
  }

  function handleSaved(provider: AlertProvider, isNew: boolean) {
    setProviders((prev) =>
      isNew ? [...prev, provider] : prev.map((p) => p.idxno === provider.idxno ? provider : p)
    );
  }

  async function handleDelete(idxno: number, providerName: string) {
    setDeletingId(idxno);
    try {
      const result = await deleteProviderAction(idxno);
      if (result.success) {
        setProviders((prev) => prev.filter((p) => p.idxno !== idxno));
        toast.success("Provider removed", { description: `${providerName} has been deleted.` });
      } else {
        toast.error("Failed to delete provider", { description: result.message });
      }
    } catch {
      toast.error("Network error", { description: "Could not reach the server." });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleProvider(provider: AlertProvider) {
    setTogglingId(provider.idxno);
    try {
      const result = await updateProviderAction(provider.idxno, {
        channel:      provider.channel,
        providerName: provider.providerName,
        apiUrl:       provider.apiUrl,
        apiKey:       provider.apiKey,
        apiSecret:    "",
        senderId:     provider.senderId,
        fromEmail:    provider.fromEmail,
        fromName:     provider.fromName,
        isActive:     !provider.isActive,
      });
      if (result.success) {
        const updated = result.data as AlertProvider;
        setProviders((prev) => prev.map((p) => p.idxno === provider.idxno ? updated : p));
        toast.success(updated.isActive ? "Provider activated" : "Provider deactivated");
      } else {
        toast.error("Failed to update provider", { description: result.message });
      }
    } catch {
      toast.error("Network error", { description: "Could not reach the server." });
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-foreground">Alert Channels</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure notification providers and select which channels to use for alerts.
          </p>
        </div>
        {perms.canCreate && (
          <Button className="gap-2 h-9" onClick={handleAdd}>
            <Plus className="w-4 h-4" />
            Add Provider
          </Button>
        )}
      </div>

      {/* Notification categories */}
      <section className="mb-8">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">Message Categories</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Control which types of messages are sent. Service alerts and transactions are always on.
            Mark promotions as opt-in to reduce spam and improve customer satisfaction.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {NOTIF_CATEGORIES.map((cat) => (
            <NotifCategoryCard
              key={cat.id}
              cat={cat}
              enabled={enabledCategories.includes(cat.id)}
              onToggle={toggleCategory}
            />
          ))}
        </div>
      </section>

      <Separator className="mb-8" />

      {/* Channel selection */}
      <section className="mb-8">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">Active Channels</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Select which channels the system will use to send alerts.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CHANNELS.map((ch) => {
            const Icon      = ch.icon;
            const active    = activeChannels.includes(ch.id);
            const count     = providers.filter((p) => p.channel === ch.id).length;

            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => toggleChannel(ch.id)}
                className={cn(
                  "relative text-left rounded-2xl border-2 p-5 transition-all duration-200 group",
                  active ? `${ch.activeBorder} ${ch.activeBg}` : "border-border bg-card hover:bg-muted/30"
                )}
              >
                <div className={cn("absolute top-4 right-4 w-2.5 h-2.5 rounded-full transition-colors", active ? "bg-success" : "bg-muted-foreground/25")} />
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors", active ? ch.bg : "bg-muted")}>
                  <Icon className={cn("w-5 h-5", active ? ch.color : "text-muted-foreground")} />
                </div>
                <p className={cn("text-sm font-semibold mb-1", active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>{ch.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{ch.description}</p>
                {count > 0 && (
                  <div className="mt-3">
                    <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5", active ? `${ch.color} border-current/20` : "text-muted-foreground border-border")}>
                      {count} provider{count !== 1 ? "s" : ""} configured
                    </Badge>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <Separator className="mb-8" />

      {/* Providers table */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Configured Providers</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your notification provider credentials.</p>
          </div>
          <span className="text-xs text-muted-foreground font-medium billing-table">
            {providers.length} {providers.length === 1 ? "provider" : "providers"}
          </span>
        </div>

        {providers.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground">No providers configured</p>
            <p className="text-xs text-muted-foreground mt-1">Add your first provider to start sending alerts.</p>
            {perms.canCreate && (
              <Button className="mt-4 gap-2 h-8 text-xs" onClick={handleAdd}>
                <Plus className="w-3.5 h-3.5" /> Add Provider
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-4 items-center px-5 py-3 bg-muted/40 border-b border-border">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Channel</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Provider</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Host / URL</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hidden md:block">From</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</span>
              <span className="w-20" />
            </div>

            {providers.map((provider, i) => {
              const ch   = CHANNELS.find((c) => c.id === provider.channel);
              const Icon = ch?.icon ?? Bell;
              const isDeleting = deletingId === provider.idxno;
              const isToggling = togglingId === provider.idxno;

              return (
                <div
                  key={provider.idxno}
                  className={cn("grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-4 items-center px-5 py-4", i < providers.length - 1 && "border-b border-border")}
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", ch?.bg ?? "bg-muted")}>
                    <Icon className={cn("w-4 h-4", ch?.color ?? "text-muted-foreground")} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{provider.providerName}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{CHANNEL_LABELS[provider.channel] ?? provider.channel}</p>
                  </div>

                  <p className="text-sm text-muted-foreground font-mono-tech truncate">{provider.apiUrl}</p>

                  <div className="min-w-0 hidden md:block">
                    <p className="text-xs text-foreground truncate">{provider.fromName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{provider.fromEmail}</p>
                  </div>

                  <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 shrink-0 font-medium", provider.isActive ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border")}>
                    {provider.isActive ? "Active" : "Inactive"}
                  </Badge>

                  <div className="flex items-center gap-1 shrink-0">
                    {perms.canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleToggleProvider(provider)}
                          disabled={isToggling}
                          aria-label={provider.isActive ? "Deactivate" : "Activate"}
                          className={cn("w-7 h-7 flex items-center justify-center rounded-md transition-colors", provider.isActive ? "text-success hover:bg-success/10" : "text-muted-foreground hover:bg-muted")}
                        >
                          {isToggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(provider)}
                          aria-label="Edit provider"
                          className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {perms.canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(provider.idxno, provider.providerName)}
                        disabled={isDeleting}
                        aria-label="Delete provider"
                        className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                      >
                        {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ProviderSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditing(null); }}
        editing={editing}
        onSaved={handleSaved}
      />
    </>
  );
}
