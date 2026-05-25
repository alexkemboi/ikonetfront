"use client";

import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { getRouterDetails, updateRouter } from "@/actions/network";
import { TopologyNode, NetworkRouter } from "@/lib/types/network-router";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import RouterActionsMenu from "./RouterActionsMenu";

interface Props {
  node: TopologyNode | null;
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
  routerPassword: Yup.string().optional(),
  hotspotEnabled: Yup.boolean().required(),
  pppoeEnabled: Yup.boolean().required(),
  freeInternet: Yup.boolean().required(),
  monitoringEnabled: Yup.boolean().required(),
});

const SERVICE_TOGGLES = [
  { field: "hotspotEnabled",    label: "Hotspot",       desc: "Hotspot service on this router" },
  { field: "pppoeEnabled",      label: "PPPoE",         desc: "PPPoE client connections" },
  { field: "freeInternet",      label: "Free Internet", desc: "Unauthenticated internet access" },
  { field: "monitoringEnabled", label: "Monitoring",    desc: "Uptime and performance tracking" },
] as const;

export default function RouterDetailSheet({ node, onClose }: Props) {
  const [routerData, setRouterData] = useState<NetworkRouter | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch full router details whenever a node is selected
  useEffect(() => {
    if (!node) return;
    setLoading(true);
    setRouterData(null);
    getRouterDetails(node.id)
      .then((res) => {
        if (res.success && res.data) setRouterData(res.data);
        else toast.error("Could not load router details.");
      })
      .catch(() => toast.error("Failed to fetch router details."))
      .finally(() => setLoading(false));
  }, [node]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      routerName:             routerData?.routerName             ?? node?.name ?? "",
      serviceMode:            routerData?.serviceMode            ?? "",
      requiresAuthentication: routerData?.requiresAuthentication ?? false,
      routerUsername:         routerData?.routerUsername         ?? "",
      routerPassword:         "",
      hotspotEnabled:         routerData?.hotspotEnabled         ?? false,
      pppoeEnabled:           routerData?.pppoeEnabled           ?? false,
      freeInternet:           routerData?.freeInternet           ?? false,
      monitoringEnabled:      routerData?.monitoringEnabled      ?? true,
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      if (!node) return;
      try {
        const result = await updateRouter(node.id, values);
        if (result.success) {
          toast.success(`"${values.routerName}" updated successfully.`);
          onClose();
        } else {
          toast.error(result.message || "Failed to update router.");
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
      setRouterData(null);
      onClose();
    }
  }

  function err(field: keyof typeof formik.errors) {
    return formik.touched[field] && formik.errors[field]
      ? String(formik.errors[field])
      : null;
  }

  return (
    <Sheet open={node !== null} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-2">
          <SheetTitle>{node?.name ?? "Router Details"}</SheetTitle>
          <SheetDescription className="font-mono text-xs">
            {node?.ipAddress}
          </SheetDescription>
        </SheetHeader>

        {/* Actions menu — top of sheet */}
        {node && (
          <div className="flex items-center justify-between py-3 mb-4 border-b border-border">
            <span className="text-xs text-muted-foreground">Remote actions</span>
            <RouterActionsMenu
              routerId={node.id}
              routerName={node.name}
            />
          </div>
        )}

        {/* Loading skeleton while fetching details */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Edit form */}
        {!loading && (
          <form onSubmit={formik.handleSubmit} noValidate className="space-y-6">
            {/* ── Basic info ── */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="d-routerName">Router Name *</Label>
                <Input
                  id="d-routerName"
                  placeholder="e.g. RTR-WESTLANDS"
                  {...formik.getFieldProps("routerName")}
                  className={err("routerName") ? "border-destructive" : ""}
                />
                {err("routerName") && (
                  <p className="text-xs text-destructive">{err("routerName")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="d-serviceMode">Service Mode *</Label>
                <Input
                  id="d-serviceMode"
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
                  <Label htmlFor="d-requiresAuthentication">Requires Authentication</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enable login credentials for this router
                  </p>
                </div>
                <Switch
                  id="d-requiresAuthentication"
                  checked={formik.values.requiresAuthentication}
                  onCheckedChange={(v) => formik.setFieldValue("requiresAuthentication", v)}
                />
              </div>

              {formik.values.requiresAuthentication && (
                <div className="space-y-3 pl-4 border-l-2 border-border">
                  <div className="space-y-2">
                    <Label htmlFor="d-routerUsername">Username *</Label>
                    <Input
                      id="d-routerUsername"
                      placeholder="Router login username"
                      {...formik.getFieldProps("routerUsername")}
                      className={err("routerUsername") ? "border-destructive" : ""}
                    />
                    {err("routerUsername") && (
                      <p className="text-xs text-destructive">{err("routerUsername")}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="d-routerPassword">
                      Password{" "}
                      <span className="text-muted-foreground font-normal">
                        (leave blank to keep current)
                      </span>
                    </Label>
                    <Input
                      id="d-routerPassword"
                      type="password"
                      placeholder="New password (optional)"
                      {...formik.getFieldProps("routerPassword")}
                    />
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
                    <Label htmlFor={`d-${field}`}>{label}</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <Switch
                    id={`d-${field}`}
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
              <Button type="submit" disabled={formik.isSubmitting || loading}>
                {formik.isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                    Saving…
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
