"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { UserPlus, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
 Sheet,
 SheetContent,
 SheetHeader,
 SheetTitle,
 SheetDescription,
} from "@/components/ui/sheet";
import { INVESTOR_ID_PATTERN, InvestorPicker } from "./InvestorPicker";
import type { InvestorOption } from "@/lib/types/investor";
import type { OrganisationOptions } from "@/lib/types/usersAccess";
import { addSystemUser, type UserData } from "@/actions/system";
import { isInvestorRoleRow, staffAssignableRoles, type ApiRole } from "@/lib/types/roles";
import { cn } from "@/lib/utils";

// ── Validation ─────────────────────────────────────────────────────────────────

/** The form rules; investor-type roles (from the roles list) need an investor party. */
const makeSchema = (investorRoles: Set<string>) => Yup.object({
 fname: Yup.string().max(50).required("First name is required"),
 middleName: Yup.string().max(50).default(""),
 otherName: Yup.string().max(50).default(""),
 username: Yup.string()
 .min(3, "Minimum 3 characters")
 .max(50, "Maximum 50 characters")
 .matches(/^[A-Za-z0-9._@-]+$/, "Letters, numbers and . _ @ - only")
 .required("Username is required"),
 email: Yup.string().max(100).email("Enter a valid email").optional(),
 phoneNumber: Yup.string()
 .matches(/^\+?[0-9]{7,15}$/, "Use an optional + followed by 7–15 digits")
 .optional(),
 role: Yup.string().required("Role is required"),
 // The backend requires an investor party for a Network Partner and refuses one for any other role.
 investorId: Yup.string()
 .default("")
 .when("role", {
 is: (role: string) => investorRoles.has((role ?? "").toUpperCase()),
 then: (field) =>
 field
 .matches(INVESTOR_ID_PATTERN, "Enter a valid investor ID")
 .required("Choose the investor this account belongs to"),
 }),
 password: Yup.string().min(12, "Minimum 12 characters").max(128, "Maximum 128 characters").required("Password is required"),
 confirmPassword: Yup.string()
 .oneOf([Yup.ref("password")], "Passwords do not match")
 .required("Confirm your password"),
});

type FormValues = Yup.InferType<ReturnType<typeof makeSchema>>;

const EMPTY: FormValues = {
 fname: "", middleName: "", otherName: "",
 username: "", email: "", phoneNumber: "",
 role: "", investorId: "", password: "", confirmPassword: "",
};

// ── Field helper ───────────────────────────────────────────────────────────────

function Field({
 label, error, required, children,
}: {
 label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
 return (
 <div className="space-y-1.5">
 <Label className="text-sm font-medium">
 {label}{required && <span className="text-destructive ml-0.5">*</span>}
 </Label>
 {children}
 {error && <p className="text-xs text-destructive">{error}</p>}
 </div>
 );
}

// ── Create User Sheet ──────────────────────────────────────────────────────────

export function CreateUserSheet({
 open,
 onClose,
 onCreated,
 roles,
 companyId,
 investors,
 isPlatformAdmin,
 organisation,
}: {
 open: boolean;
 onClose: () => void;
 onCreated: () => void;
 roles: ApiRole[];
 companyId: string | null;
 investors: InvestorOption[];
 isPlatformAdmin: boolean;
 /** Locations and stations of the company the account will belong to. */
 organisation?: OrganisationOptions | null;
}) {
 const [stationId, setStationId] = useState("");
 const [locationId, setLocationId] = useState("");
 // Offer only roles the backend lets this caller assign: SYSADMIN and customer
 // accounts have their own flows, and only a SYSADMIN creates a Network Partner.
 const assignableRoles = staffAssignableRoles(roles).filter(
 (r) => isPlatformAdmin || r.principalType !== "INVESTOR"
 );
 const schema = useMemo(
 () => makeSchema(new Set(roles.filter((r) => r.principalType === "INVESTOR").map((r) => r.roleCode.toUpperCase()))),
 [roles]
 );
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);
 const router = useRouter();

 const formik = useFormik<FormValues>({
 initialValues: EMPTY,
 validationSchema: schema,
 onSubmit: async (values, { resetForm, setFieldError }) => {
 // A Network Partner login belongs to no company, so an investor working with several
 // companies is not tied to one; every other account belongs to the selected company.
 const investorLogin = isInvestorRoleRow(roles, values.role);
 if (!companyId && !investorLogin) {
 toast.error("Choose a company in the top bar before creating a staff account.");
 return;
 }
 const payload: UserData = {
 fname: values.fname,
 middleName: values.middleName ?? "",
 otherName: values.otherName ?? "",
 username: values.username,
 email: values.email || undefined,
 phoneNumber: values.phoneNumber || undefined,
 role: values.role,
 password: values.password,
 ...(investorLogin ? { investorId: values.investorId } : { companyId: companyId ?? undefined }),
 ...(!investorLogin && stationId ? { stationId } : {}),
 ...(!investorLogin && !stationId && locationId ? { locationId: Number(locationId) } : {}),
 };

 const result = await addSystemUser(payload);

 if (result.success && result.data) {
 toast.success("User created", {
 description: `${values.fname} has been added as a system user.`,
 });
 resetForm();
 setStationId("");
 setLocationId("");
 onClose();
 onCreated();
 router.refresh();
 } else {
 const fieldByCode: Record<string, keyof FormValues> = {
   USERNAME_ALREADY_EXISTS: "username",
   EMAIL_ALREADY_EXISTS: "email",
   PHONE_ALREADY_EXISTS: "phoneNumber",
 };
 const field = result.code ? fieldByCode[result.code] : undefined;
 if (field) setFieldError(field, result.message);
 toast.error("Failed to create user", {
 description: result.message ?? "Something went wrong.",
 });
 }
 },
 });

 const { touched, errors } = formik;

 function handleClose() {
 formik.resetForm();
 setShowPassword(false);
 setShowConfirm(false);
 onClose();
 }

 return (
 <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
 <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
 <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
 <SheetTitle>Create System User</SheetTitle>
 <SheetDescription>
 Add a staff account with a password you choose. If your security settings require it, the person must choose a new password at their first sign-in.
 </SheetDescription>
 </SheetHeader>

 <form
 onSubmit={formik.handleSubmit}
 noValidate
 className="flex flex-col flex-1 overflow-hidden"
 >
 <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

 {/* ── Personal Info ── */}
 <div className="space-y-4">
 <SectionDivider label="Personal Info" />

 <div className="grid grid-cols-2 gap-3">
 <Field label="First Name" error={touched.fname ? errors.fname : undefined} required>
 <Input
 placeholder="John"
 {...formik.getFieldProps("fname")}
 className={cn(touched.fname && errors.fname && "border-destructive")}
 />
 </Field>
 <Field label="Middle Name" error={touched.middleName ? errors.middleName : undefined}>
 <Input placeholder="Kamau" {...formik.getFieldProps("middleName")} />
 </Field>
 </div>

 <Field label="Other Name" error={touched.otherName ? errors.otherName : undefined}>
 <Input placeholder="Mwangi" {...formik.getFieldProps("otherName")} />
 </Field>
 </div>

 {/* ── Contact ── */}
 <div className="space-y-4">
 <SectionDivider label="Contact" />

 <Field label="Email Address" error={touched.email ? errors.email : undefined} required>
 <Input
 type="email"
 placeholder="john@example.com"
 {...formik.getFieldProps("email")}
 className={cn(touched.email && errors.email && "border-destructive")}
 />
 </Field>

 <Field label="Phone Number" error={touched.phoneNumber ? errors.phoneNumber : undefined}>
 <Input
 type="tel"
 inputMode="numeric"
 placeholder="+254712345678"
 {...formik.getFieldProps("phoneNumber")}
 className={cn(touched.phoneNumber && errors.phoneNumber && "border-destructive")}
 />
 </Field>
 </div>

 {/* ── Account ── */}
 <div className="space-y-4">
 <SectionDivider label="Account" />

 <Field label="Username" error={touched.username ? errors.username : undefined} required>
 <Input
 placeholder="john.kamau"
 autoComplete="off"
 {...formik.getFieldProps("username")}
 className={cn(touched.username && errors.username && "border-destructive")}
 />
 </Field>

 <Field label="Role" error={touched.role ? errors.role : undefined} required>
 <Select
 value={formik.values.role}
 onValueChange={(value) => {
 formik.setFieldValue("role", value);
 formik.setFieldTouched("role", true, false);
 }}
 >
 <SelectTrigger
 aria-invalid={Boolean(touched.role && errors.role)}
 className={cn("w-full", touched.role && errors.role && "border-destructive")}
 >
 <SelectValue placeholder="Select a role…" />
 </SelectTrigger>
 <SelectContent>
 {assignableRoles.map((r) => (
 <SelectItem key={r.roleCode} value={r.roleCode}>
 {r.name}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </Field>

 {isInvestorRoleRow(roles, formik.values.role) && (
 <Field
 label="Investor record"
 error={touched.investorId ? errors.investorId : undefined}
 required
 >
 <InvestorPicker
 value={formik.values.investorId}
 onChange={(id) => {
 formik.setFieldValue("investorId", id);
 formik.setFieldTouched("investorId", true, false);
 }}
 options={investors}
 invalid={Boolean(touched.investorId && errors.investorId)}
 />
 </Field>
 )}
 </div>

 {/* ── Organisation ── */}
 {organisation && !isInvestorRoleRow(roles, formik.values.role) && (
 <div className="space-y-4">
 <SectionDivider label="Organisation" />
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 <Field label="Location">
 <select
 aria-label="Location"
 value={stationId ? String(organisation.stations.find((s) => String(s.id) === stationId)?.locationId ?? "") : locationId}
 onChange={(e) => { setLocationId(e.target.value); setStationId(""); }}
 className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
 >
 <option value="">No location</option>
 {organisation.locations.map((l) => <option key={l.id} value={String(l.id)}>{l.name}</option>)}
 </select>
 </Field>
 <Field label="Station">
 <select
 aria-label="Station"
 value={stationId}
 onChange={(e) => setStationId(e.target.value)}
 className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
 >
 <option value="">No station</option>
 {organisation.stations
 .filter((s) => !locationId || String(s.locationId) === locationId)
 .map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
 </select>
 </Field>
 </div>
 </div>
 )}

 {/* ── Password ── */}
 <div className="space-y-4">
 <SectionDivider label="Password" />

 <Field label="Password" error={touched.password ? errors.password : undefined} required>
 <div className="relative">
 <Input
 type={showPassword ? "text" : "password"}
 placeholder="Min. 12 characters"
 autoComplete="new-password"
 {...formik.getFieldProps("password")}
 className={cn("pr-10", touched.password && errors.password && "border-destructive")}
 />
 <button
 type="button"
 onClick={() => setShowPassword((v) => !v)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
 >
 {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </Field>

 <Field label="Confirm Password" error={touched.confirmPassword ? errors.confirmPassword : undefined} required>
 <div className="relative">
 <Input
 type={showConfirm ? "text" : "password"}
 placeholder="Re-enter password"
 autoComplete="new-password"
 {...formik.getFieldProps("confirmPassword")}
 className={cn("pr-10", touched.confirmPassword && errors.confirmPassword && "border-destructive")}
 />
 <button
 type="button"
 onClick={() => setShowConfirm((v) => !v)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
 >
 {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </Field>
 </div>

 </div>

 {/* Footer */}
 <div className="shrink-0 px-6 py-4 border-t border-border flex gap-3">
 <Button type="submit" className="flex-1" disabled={formik.isSubmitting}>
 {formik.isSubmitting
 ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating…</>
 : <><UserPlus className="w-4 h-4 mr-2" />Create User</>}
 </Button>
 <Button type="button" variant="outline" onClick={handleClose} disabled={formik.isSubmitting}>
 Cancel
 </Button>
 </div>
 </form>
 </SheetContent>
 </Sheet>
 );
}

function SectionDivider({ label }: { label: string }) {
 return (
 <div className="flex items-center gap-2">
 <div className="h-px flex-1 bg-border" />
 <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
 <div className="h-px flex-1 bg-border" />
 </div>
 );
}
