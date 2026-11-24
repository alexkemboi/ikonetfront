"use client";

import { useMemo, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InvestorPicker } from "./InvestorPicker";
import type { InvestorOption } from "@/lib/types/investor";
import type { OrganisationOptions } from "@/lib/types/usersAccess";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { isInvestorRoleRow, staffAssignableRoles, type ApiRole, type ApiRoleUser } from "@/lib/types/roles";
import {
  linkSystemUserInvestor,
  updateSystemUser,
  updateSystemUserRole,
} from "@/actions/system";
import { cn } from "@/lib/utils";

const schema = Yup.object({
  fname: Yup.string().max(50).required("First name is required"),
  middleName: Yup.string().max(50),
  otherName: Yup.string().max(50),
  username: Yup.string()
    .min(3)
    .max(50)
    .matches(/^[A-Za-z0-9._@-]+$/, "Letters, numbers and . _ @ - only")
    .required("Username is required"),
  email: Yup.string().max(100).email("Enter a valid email").optional(),
  phoneNumber: Yup.string()
    .matches(/^\+?[0-9]{7,15}$/, "Use an optional + followed by 7–15 digits")
    .optional(),
  role: Yup.string().required("Role is required"),
});

type FormValues = Yup.InferType<typeof schema> & {
  isactive: boolean;
  canLogin: boolean;
  /** "" = no station. A station decides the location. */
  stationId: string;
  /** "" = no location. */
  locationId: string;
};

export function EditUserSheet({
  open,
  onClose,
  user,
  roles,
  canLinkInvestor,
  investors,
  onLinked,
  organisation,
}: {
  open: boolean;
  onClose: () => void;
  user: ApiRoleUser | null;
  roles: ApiRole[];
  canLinkInvestor: boolean;
  /** Active investors of the register, offered when linking a Network Partner account. */
  investors: InvestorOption[];
  onLinked: () => void;
  /** Locations and stations of the user's company; when given, the sheet edits station and location too. */
  organisation?: OrganisationOptions | null;
}) {
  const [investorId, setInvestorId] = useState("");
  const [linking, setLinking] = useState(false);
  const roleOptions = useMemo(
    () => staffAssignableRoles(roles),
    [roles]
  );
  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues: {
      fname: user?.fname ?? "",
      middleName: user?.middleName ?? "",
      otherName: user?.otherName ?? "",
      username: user?.username ?? "",
      email: user?.email ?? "",
      phoneNumber: user?.phoneNumber ?? "",
      role: user?.role ?? "",
      isactive: user?.isactive ?? true,
      canLogin: user?.canLogin ?? true,
      stationId: user?.stationId ?? "",
      locationId: user?.locationId ? String(user.locationId) : "",
    },
    validationSchema: schema,
    onSubmit: async (values, { setFieldError }) => {
      if (!user) return;
      const details = await updateSystemUser(user.idxno, {
        fname: values.fname,
        middleName: values.middleName || undefined,
        otherName: values.otherName || undefined,
        username: values.username,
        email: values.email || undefined,
        phoneNumber: values.phoneNumber || undefined,
        isactive: values.isactive,
        canLogin: values.canLogin,
        // only what changed: "" clears the station; 0 clears the location (a station keeps its own)
        ...(organisation && values.stationId !== (user.stationId ?? "") ? { stationId: values.stationId } : {}),
        ...(organisation && !values.stationId && values.locationId !== (user.locationId ? String(user.locationId) : "")
          ? { locationId: Number(values.locationId || 0) }
          : {}),
      });
      if (!details.success) {
        const fieldByCode: Record<string, keyof FormValues> = {
          USERNAME_ALREADY_EXISTS: "username",
          EMAIL_ALREADY_EXISTS: "email",
          PHONE_ALREADY_EXISTS: "phoneNumber",
        };
        const field = details.code ? fieldByCode[details.code] : undefined;
        if (field) setFieldError(field, details.message);
        toast.error("Failed to update user", { description: details.message });
        return;
      }
      const becomesInvestor = isInvestorRoleRow(roles, values.role) && !isInvestorRoleRow(roles, user.role);
      if (becomesInvestor && canLinkInvestor && !investorId.trim()) {
        toast.error("Choose the investor this account belongs to", {
          description: "A Network Partner account shows one investor's routers and revenue.",
        });
        return;
      }
      if (values.role !== user.role) {
        const roleResult = await updateSystemUserRole(user.idxno, values.role);
        if (!roleResult.success) {
          toast.error("User details saved, but role update failed", {
            description: roleResult.message,
          });
          onLinked();
          return;
        }
        if (becomesInvestor && investorId.trim()) {
          const linked = await linkSystemUserInvestor(user.idxno, investorId.trim());
          if (!linked.success) {
            toast.error("Role changed, but the investor was not linked", { description: linked.message });
            onLinked();
            return;
          }
        }
      }
      toast.success("System user updated");
      onLinked();
      onClose();
    },
  });

  async function handleInvestorLink() {
    if (!user || !investorId.trim()) return;
    setLinking(true);
    try {
      const result = await linkSystemUserInvestor(user.idxno, investorId.trim());
      if (!result.success) {
        toast.error("Investor link failed", { description: result.message });
        return;
      }
      toast.success("Investor account linked", {
        description: "The investor must sign in again to receive the updated scope.",
      });
      onLinked();
    } finally {
      setLinking(false);
    }
  }

  return (
    <Sheet open={open && Boolean(user)} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 border-b px-6 py-5">
          <SheetTitle>Edit System User</SheetTitle>
          <SheetDescription>Update staff details and account access.</SheetDescription>
        </SheetHeader>
        {user && (
          <form onSubmit={formik.handleSubmit} noValidate className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {([
                ["fname", "First name"],
                ["middleName", "Middle name"],
                ["otherName", "Other name"],
                ["username", "Username"],
                ["email", "Email"],
                ["phoneNumber", "Phone number"],
              ] as const).map(([field, label]) => (
                <div key={field} className="space-y-1.5">
                  <Label htmlFor={`user-${field}`}>{label}</Label>
                  <Input
                    id={`user-${field}`}
                    type={field === "email" ? "email" : "text"}
                    {...formik.getFieldProps(field)}
                    aria-invalid={Boolean(formik.touched[field] && formik.errors[field])}
                    className={cn(formik.touched[field] && formik.errors[field] && "border-destructive")}
                  />
                  {formik.touched[field] && formik.errors[field] && (
                    <p className="text-xs text-destructive">{formik.errors[field]}</p>
                  )}
                </div>
              ))}
              <div className="space-y-1.5">
                <Label htmlFor="user-role">Role</Label>
                <select
                  id="user-role"
                  {...formik.getFieldProps("role")}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {roleOptions.map((role) => (
                    <option key={role.roleCode} value={role.roleCode}>{role.name}</option>
                  ))}
                </select>
              </div>
              {organisation && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="user-location">Location</Label>
                    <select
                      id="user-location"
                      value={formik.values.stationId
                        ? String(organisation.stations.find((s) => String(s.id) === formik.values.stationId)?.locationId ?? "")
                        : formik.values.locationId}
                      onChange={(e) => {
                        formik.setFieldValue("locationId", e.target.value);
                        formik.setFieldValue("stationId", "");
                      }}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">No location</option>
                      {organisation.locations.map((l) => (
                        <option key={l.id} value={String(l.id)}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="user-station">Station</Label>
                    <select
                      id="user-station"
                      value={formik.values.stationId}
                      onChange={(e) => formik.setFieldValue("stationId", e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">No station</option>
                      {organisation.stations
                        .filter((s) => !formik.values.locationId || formik.values.stationId || String(s.locationId) === formik.values.locationId)
                        .map((s) => (
                          <option key={s.id} value={String(s.id)}>{s.name}</option>
                        ))}
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground sm:col-span-2">
                    Only this company&apos;s locations and stations are offered. A station sets the location.
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label htmlFor="user-active">Active</Label>
                <Switch
                  id="user-active"
                  checked={formik.values.isactive}
                  onCheckedChange={(value) => formik.setFieldValue("isactive", value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="user-login">Login enabled</Label>
                <Switch
                  id="user-login"
                  checked={formik.values.canLogin}
                  onCheckedChange={(value) => formik.setFieldValue("canLogin", value)}
                />
              </div>
              {canLinkInvestor && (isInvestorRoleRow(roles, user.role) || isInvestorRoleRow(roles, formik.values.role)) && (
                <div className="space-y-2 rounded-md border p-3">
                  <Label>Investor</Label>
                  <InvestorPicker value={investorId} onChange={setInvestorId} options={investors} />
                  <p className="text-xs text-muted-foreground">
                    {isInvestorRoleRow(roles, user.role)
                      ? "Linking updates investor scope on the next sign-in."
                      : "Saving changes the role and links this investor. The account then sees only that investor's routers and revenue."}
                  </p>
                  {isInvestorRoleRow(roles, user.role) && (
                  <Button type="button" variant="outline" onClick={handleInvestorLink} disabled={linking || !investorId.trim()}>
                    {linking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Link investor
                  </Button>
                  )}
                </div>
              )}
            </div>
            <div className="flex shrink-0 gap-3 border-t px-6 py-4">
              <Button type="submit" className="flex-1" disabled={formik.isSubmitting}>
                {formik.isSubmitting
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Save className="mr-2 h-4 w-4" />}
                Save changes
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={formik.isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
