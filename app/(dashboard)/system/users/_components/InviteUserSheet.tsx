"use client";

import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { inviteUser } from "@/actions/usersAccess";
import { staffAssignableRoles, type ApiRole } from "@/lib/types/roles";
import type { OrganisationOptions } from "@/lib/types/usersAccess";
import type { CompanySummary } from "@/actions/companies";
import { TenantCompanyField, tenantIdOf } from "./TenantCompanyField";
import { cn } from "@/lib/utils";

const schema = Yup.object({
  email: Yup.string().trim().max(100).email("Enter a valid email").required("Email is required"),
  fname: Yup.string().trim().max(50).required("First name is required"),
  otherName: Yup.string().trim().max(50),
  phoneNumber: Yup.string().matches(/^\+?[0-9]{7,15}$/, "Use an optional + followed by 7–15 digits"),
  role: Yup.string().required("Choose a role"),
  locationId: Yup.string(),
  stationId: Yup.string(),
});

type Values = Yup.InferType<typeof schema>;

const EMPTY: Values = { email: "", fname: "", otherName: "", phoneNumber: "", role: "", locationId: "", stationId: "" };

/**
 * Invite a person by email: they receive a single-use link and choose their own username and
 * password. Network Partner logins are linked to an investor, so they are created with Create user.
 */
export function InviteUserSheet({
  open,
  onClose,
  onInvited,
  roles,
  companyId,
  organisation,
  companies = [],
  canChooseCompany = false,
}: {
  open: boolean;
  onClose: () => void;
  onInvited: () => void;
  roles: ApiRole[];
  companyId: string | null;
  /** Locations and stations of the company in scope (reused while it stays chosen). */
  organisation: OrganisationOptions | null;
  /** Organisations a role that reaches every company may invite into. */
  companies?: CompanySummary[];
  /** The caller reaches every company: the form asks for the tenant / company. */
  canChooseCompany?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [company, setCompany] = useState(companyId ?? "");
  const [companyError, setCompanyError] = useState<string | undefined>();
  const [options, setOptions] = useState<OrganisationOptions | null>(organisation);
  // each time the form opens it starts from the company in scope (state adjusted while rendering)
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setCompany(companyId ?? "");
  }
  const roleOptions = staffAssignableRoles(roles).filter((r) => r.principalType !== "INVESTOR");

  const formik = useFormik<Values>({
    initialValues: EMPTY,
    validationSchema: schema,
    onSubmit: async (values, { resetForm, setFieldError }) => {
      if (!company) {
        setCompanyError("Choose the organisation this person will belong to");
        return;
      }
      setBusy(true);
      try {
        const res = await inviteUser({
          email: values.email.trim(),
          fname: values.fname.trim(),
          otherName: values.otherName?.trim() || undefined,
          phoneNumber: values.phoneNumber || undefined,
          role: values.role,
          stationId: values.stationId || undefined,
          locationId: !values.stationId && values.locationId ? Number(values.locationId) : undefined,
          // the company by code and by tenant id: the API checks both name the same organisation
          companyId: company,
          tenantId: tenantIdOf(companies, company),
        });
        if (!res.success) {
          if (res.code === "EMAIL_ALREADY_EXISTS" || res.code === "INVITATION_EXISTS") setFieldError("email", res.message);
          if (res.code === "PHONE_ALREADY_EXISTS") setFieldError("phoneNumber", res.message);
          toast.error("Could not send the invitation", { description: res.message });
          return;
        }
        toast.success("Invitation sent", { description: `${values.fname.trim()} will receive a link at ${values.email.trim()}.` });
        resetForm();
        onInvited();
        onClose();
      } finally {
        setBusy(false);
      }
    },
  });

  const error = (field: keyof Values) => (formik.touched[field] ? formik.errors[field] : undefined);
  const close = () => {
    formik.resetForm();
    setCompanyError(undefined);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(value) => !value && close()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 border-b px-6 py-5">
          <SheetTitle>Invite user</SheetTitle>
          <SheetDescription>
            The person receives a link by email and chooses their own username and password. The link works once and
            expires after 7 days.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={formik.handleSubmit} noValidate className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <FormField id="invite-email" label="Email address" required error={error("email")}>
              <Input id="invite-email" type="email" autoComplete="off" placeholder="jane@example.com"
                {...formik.getFieldProps("email")} aria-invalid={Boolean(error("email"))}
                className={cn(error("email") && "border-destructive")} />
            </FormField>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField id="invite-fname" label="First name" required error={error("fname")}>
                <Input id="invite-fname" {...formik.getFieldProps("fname")} aria-invalid={Boolean(error("fname"))}
                  className={cn(error("fname") && "border-destructive")} />
              </FormField>
              <FormField id="invite-other" label="Other name" error={error("otherName")}>
                <Input id="invite-other" {...formik.getFieldProps("otherName")} />
              </FormField>
            </div>
            <FormField id="invite-phone" label="Phone number" error={error("phoneNumber")}>
              <Input id="invite-phone" type="tel" inputMode="numeric" placeholder="+254712345678"
                {...formik.getFieldProps("phoneNumber")} aria-invalid={Boolean(error("phoneNumber"))}
                className={cn(error("phoneNumber") && "border-destructive")} />
            </FormField>
            <FormField id="invite-role" label="Role" required error={error("role")}>
              <select id="invite-role" {...formik.getFieldProps("role")} aria-invalid={Boolean(error("role"))}
                className={cn("flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm", error("role") && "border-destructive")}>
                <option value="">Select a role…</option>
                {roleOptions.map((r) => <option key={r.roleCode} value={r.roleCode}>{r.name}</option>)}
              </select>
            </FormField>
            <TenantCompanyField
              id="invite-company"
              companies={companies}
              canChoose={canChooseCompany}
              value={company}
              onChange={(code) => {
                setCompany(code);
                setCompanyError(undefined);
                formik.setFieldValue("stationId", "");
                formik.setFieldValue("locationId", "");
              }}
              onOptions={setOptions}
              initialOptions={{ code: companyId, options: organisation }}
              error={companyError}
            />
            {options && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField id="invite-location" label="Location">
                  <select id="invite-location" value={formik.values.locationId}
                    onChange={(e) => { formik.setFieldValue("locationId", e.target.value); formik.setFieldValue("stationId", ""); }}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">No location</option>
                    {options.locations.map((l) => <option key={l.id} value={String(l.id)}>{l.name}</option>)}
                  </select>
                </FormField>
                <FormField id="invite-station" label="Station">
                  <select id="invite-station" {...formik.getFieldProps("stationId")}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">No station</option>
                    {options.stations
                      .filter((s) => !formik.values.locationId || String(s.locationId) === formik.values.locationId)
                      .map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                  </select>
                </FormField>
              </div>
            )}
          </div>
          <div className="flex shrink-0 gap-3 border-t px-6 py-4">
            <Button type="submit" className="flex-1" disabled={busy}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
              Send invitation
            </Button>
            <Button type="button" variant="outline" onClick={close} disabled={busy}>Cancel</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function FormField({ id, label, required, error, children }: {
  id: string; label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
