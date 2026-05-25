"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { finalizeRouter } from "@/actions/network";
import { NetworkRouter } from "@/lib/types/network-router";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

interface Props {
  router: NetworkRouter | null;
  onClose: () => void;
}

const schema = Yup.object({
  routerName: Yup.string().required("Router name is required"),
  serviceMode: Yup.string().required("Service mode is required"),
  requiresAuthentication: Yup.boolean().required(),
  routerUsername: Yup.string().when("requiresAuthentication", {
    is: true,
    then: (s) => s.required("Username is required when authentication is enabled"),
    otherwise: (s) => s.optional(),
  }),
  routerPassword: Yup.string().when("requiresAuthentication", {
    is: true,
    then: (s) => s.required("Password is required when authentication is enabled"),
    otherwise: (s) => s.optional(),
  }),
  hotspotEnabled: Yup.boolean().required(),
  pppoeEnabled: Yup.boolean().required(),
  freeInternet: Yup.boolean().required(),
  monitoringEnabled: Yup.boolean().required(),
});

const SERVICE_TOGGLES = [
  { field: "hotspotEnabled",    label: "Hotspot",    desc: "Enable hotspot service on this router" },
  { field: "pppoeEnabled",      label: "PPPoE",      desc: "Enable PPPoE client connections" },
  { field: "freeInternet",      label: "Free Internet", desc: "Allow unauthenticated internet access" },
  { field: "monitoringEnabled", label: "Monitoring", desc: "Track uptime and performance metrics" },
] as const;

export default function FinalizeRouterSheet({ router, onClose }: Props) {
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      routerName: "",
      serviceMode: "",
      requiresAuthentication: false,
      routerUsername: "",
      routerPassword: "",
      hotspotEnabled: false,
      pppoeEnabled: false,
      freeInternet: false,
      monitoringEnabled: true,
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      if (!router) return;
      try {
        const result = await finalizeRouter(router.id, values);
        if (result.success) {
          toast.success(`"${values.routerName}" has been configured and added to the network.`);
          resetForm();
          onClose();
        } else {
          toast.error(result.message || "Failed to finalize router setup.");
        }
      } catch {
        toast.error("An unexpected error occurred. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  function handleOpenChange(open: boolean) {
    if (!open) {
      formik.resetForm();
      onClose();
    }
  }

  function err(field: keyof typeof formik.errors) {
    return formik.touched[field] && formik.errors[field]
      ? String(formik.errors[field])
      : null;
  }

  return (
    <Sheet open={router !== null} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-4 overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Finalize Router Setup</SheetTitle>
          <SheetDescription>
            Configure this device before adding it to the network. IP:{" "}
            <span className="font-mono font-medium text-foreground">
              {router?.ipAddress}
            </span>
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={formik.handleSubmit} noValidate className="space-y-6">
          {/* ── Basic info ── */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="routerName">Router Name *</Label>
              <Input
                id="routerName"
                placeholder="e.g. RTR-WESTLANDS"
                {...formik.getFieldProps("routerName")}
                className={err("routerName") ? "border-destructive" : ""}
              />
              {err("routerName") && (
                <p className="text-xs text-destructive">{err("routerName")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceMode">Service Mode *</Label>
              <Input
                id="serviceMode"
                placeholder="e.g. PPPoE, Hotspot, Bridge"
                {...formik.getFieldProps("serviceMode")}
                className={err("serviceMode") ? "border-destructive" : ""}
              />
              {err("serviceMode") && (
                <p className="text-xs text-destructive">{err("serviceMode")}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* ── Authentication ── */}
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Authentication
            </p>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requiresAuthentication">Requires Authentication</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enable login credentials for this router
                </p>
              </div>
              <Switch
                id="requiresAuthentication"
                checked={formik.values.requiresAuthentication}
                onCheckedChange={(v) => formik.setFieldValue("requiresAuthentication", v)}
              />
            </div>

            {formik.values.requiresAuthentication && (
              <div className="space-y-3 pl-4 border-l-2 border-border">
                <div className="space-y-2">
                  <Label htmlFor="routerUsername">Username *</Label>
                  <Input
                    id="routerUsername"
                    placeholder="Router login username"
                    {...formik.getFieldProps("routerUsername")}
                    className={err("routerUsername") ? "border-destructive" : ""}
                  />
                  {err("routerUsername") && (
                    <p className="text-xs text-destructive">{err("routerUsername")}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="routerPassword">Password *</Label>
                  <Input
                    id="routerPassword"
                    type="password"
                    placeholder="Router login password"
                    {...formik.getFieldProps("routerPassword")}
                    className={err("routerPassword") ? "border-destructive" : ""}
                  />
                  {err("routerPassword") && (
                    <p className="text-xs text-destructive">{err("routerPassword")}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* ── Services ── */}
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Services
            </p>

            {SERVICE_TOGGLES.map(({ field, label, desc }) => (
              <div key={field} className="flex items-center justify-between">
                <div>
                  <Label htmlFor={field}>{label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <Switch
                  id={field}
                  checked={formik.values[field]}
                  onCheckedChange={(v) => formik.setFieldValue(field, v)}
                />
              </div>
            ))}
          </div>

          <SheetFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={formik.isSubmitting}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                  Saving…
                </>
              ) : (
                "Finalize Router"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
