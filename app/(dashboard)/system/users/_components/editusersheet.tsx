"use client"
import { UserData } from "@/actions/system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
 Sheet,
 SheetContent,
 SheetHeader,
 SheetTitle,
 SheetDescription,
} from "@/components/ui/sheet";
import type { ApiRole, ApiRoleUser } from "@/lib/types/roles";
import { cn } from "@/lib/utils";
import { useFormik } from "formik";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import * as Yup from "yup"



const schema = Yup.object({
 fname: Yup.string().required("First name is required"),
 middleName: Yup.string().default(""),
 otherName: Yup.string().default(""),
 username: Yup.string().min(3, "Minimum 3 characters").required("Username is required"),
 email: Yup.string().email("Enter a valid email").required("Email is required"),
 phoneNumber: Yup.string()
 .matches(/^(07|01)\d{8}$/, "Enter a valid Kenyan number (07xxxxxxxx)")
 .required("Phone number is required"),
 role: Yup.string().required("Role is required"),
 password: Yup.string().min(8, "Minimum 8 characters").required("Password is required"),
 confirmPassword: Yup.string()
 .oneOf([Yup.ref("password")], "Passwords do not match")
 .required("Confirm your password"),
});

type FormValues = Yup.InferType<typeof schema>;

const EMPTY: FormValues = {
 fname: "", middleName: "", otherName: "",
 username: "", email: "", phoneNumber: "",
 role: "", password: "", confirmPassword: "",
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



function SectionDivider({ label }: { label: string }) {
 return (
 <div className="flex items-center gap-2">
 <div className="h-px flex-1 bg-border" />
 <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
 <div className="h-px flex-1 bg-border" />
 </div>
 );
}

export function EditUserSheet({
 open,
 onClose,
 roles,
}: {
 open: boolean;
 onClose: () => void;
 roles: ApiRole[];
}) {
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);

 const formik = useFormik<FormValues>({
 initialValues: EMPTY,
 validationSchema: schema,
 onSubmit: async (values, { resetForm }) => {
 const payload: UserData = {
 fname: values.fname,
 middleName: values.middleName ?? "",
 otherName: values.otherName ?? "",
 username: values.username,
 email: values.email,
 phoneNumber: values.phoneNumber,
 role: values.role,
 password: values.password,
 };

 // const result = await addSystemUser(payload);

 // if (result.success && result.data) {
 // toast.success("User created", {
 // description: `${values.fname} has been added as a system user.`,
 // });
 // resetForm();
 // onClose();
 // } else {
 // toast.error("Failed to create user", {
 // description: result.message ?? "Something went wrong.",
 // });
 // }
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
 <SheetTitle>Edit System User</SheetTitle>
 <SheetDescription>
 Edit the details of an existing system user.
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

 <Field label="Phone Number" error={touched.phoneNumber ? errors.phoneNumber : undefined} required>
 <Input
 type="tel"
 inputMode="numeric"
 placeholder="07XX XXX XXX"
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
 <select
 {...formik.getFieldProps("role")}
 className={cn(
 "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors",
 "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
 touched.role && errors.role ? "border-destructive" : "border-input"
 )}
 >
 <option value="">Select a role…</option>
 {roles.map((r) => (
 <option key={r.roleCode} value={r.roleCode}>
 {r.name}
 </option>
 ))}
 </select>
 </Field>
 </div>

 {/* ── Password ── */}
 <div className="space-y-4">
 <SectionDivider label="Password" />

 <Field label="Password" error={touched.password ? errors.password : undefined} required>
 <div className="relative">
 <Input
 type={showPassword ? "text" : "password"}
 placeholder="Min. 8 characters"
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
