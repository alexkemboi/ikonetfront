"use client";

import { useCompanyScope } from "@/providers/CompanyScopeProvider";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { UserPlus, Loader2, Users, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/providers/PermissionsProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
 Sheet,
 SheetContent,
 SheetHeader,
 SheetTitle,
 SheetDescription,
} from "@/components/ui/sheet";
import { DataTable } from "@/components/shared/data-table";
import { useStaffUserColumns } from "./columns";
import { INVESTOR_ID_PATTERN, InvestorPicker } from "./InvestorPicker";
import type { InvestorOption } from "@/lib/types/investor";
import {
 addSystemUser,
 deleteSystemUser,
 getSystemUsersPage,
 type SystemUsersPage,
 type UserData,
} from "@/actions/system";
import { isInvestorRole, isPlatformAdminRole, type ApiRole, type ApiRoleUser } from "@/lib/types/roles";
import { cn } from "@/lib/utils";
import { EditUserSheet } from "./editusersheet";

import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Validation ─────────────────────────────────────────────────────────────────

const schema = Yup.object({
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
 is: (role: string) => isInvestorRole(role),
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

type FormValues = Yup.InferType<typeof schema>;

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

function CreateUserSheet({
 open,
 onClose,
 onCreated,
 roles,
 companyId,
 investors,
 isPlatformAdmin,
}: {
 open: boolean;
 onClose: () => void;
 onCreated: () => void;
 roles: ApiRole[];
 companyId: string | null;
 investors: InvestorOption[];
 isPlatformAdmin: boolean;
}) {
 // Offer only roles the backend lets this caller assign: SYSADMIN and customer
 // accounts have their own flows, and only a SYSADMIN creates a Network Partner.
 const assignableRoles = roles.filter(
 (r) =>
 !["05", "CUSTOMER"].includes(r.roleCode.toUpperCase()) &&
 !isPlatformAdminRole(r.roleCode) &&
 (isPlatformAdmin || !isInvestorRole(r.roleCode))
 );
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);
 const router = useRouter();

 const formik = useFormik<FormValues>({
 initialValues: EMPTY,
 validationSchema: schema,
 onSubmit: async (values, { resetForm, setFieldError }) => {
 if (!companyId) {
 toast.error("Choose a company before creating a user.");
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
 companyId,
 ...(isInvestorRole(values.role) ? { investorId: values.investorId } : {}),
 };

 const result = await addSystemUser(payload);

 if (result.success && result.data) {
 toast.success("User created", {
 description: `${values.fname} has been added as a system user.`,
 });
 resetForm();
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
 Add a new staff account. The user will receive login credentials for their assigned role.
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
 <select
 {...formik.getFieldProps("role")}
 className={cn(
 "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors",
 "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
 touched.role && errors.role ? "border-destructive" : "border-input"
 )}
 >
 <option value="">Select a role…</option>
 {assignableRoles.map((r) => (
 <option key={r.roleCode} value={r.roleCode}>
 {r.name}
 </option>
 ))}
 </select>
 </Field>

 {isInvestorRole(formik.values.role) && (
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

// ── Main client ────────────────────────────────────────────────────────────────

interface StaffUsersClientProps {
  initialPage: SystemUsersPage;
 roles: ApiRole[];
  isPlatformAdmin: boolean;
  canManageUsers: boolean;
  /** Investor parties a SYSADMIN can link a Network Partner to (empty for other roles). */
  investors: InvestorOption[];
}

export default function StaffUsersClient({ initialPage, roles, isPlatformAdmin, canManageUsers, investors }: StaffUsersClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ApiRoleUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiRoleUser | null>(null);
  const [page, setPage] = useState(initialPage);
  const [pageIndex, setPageIndex] = useState(initialPage.number);
  const [pageSize, setPageSize] = useState(initialPage.size || 20);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [isPending, startTransition] = useTransition();
  const requestSequence = useRef(0);
  const perms = usePermissions("/system/users");
  const { requireCompany, companyCode } = useCompanyScope();
  const router = useRouter();
  const reloadPage = useCallback(() => {
    const requestId = ++requestSequence.current;
    startTransition(async () => {
    const response = await getSystemUsersPage({
      page: pageIndex,
      size: pageSize,
      q: search,
      role: roleFilter || undefined,
      active: activeFilter === "" ? undefined : activeFilter === "true",
    });
    if (requestId !== requestSequence.current) return;
    if (!response.success || !response.data) {
      toast.error("Could not refresh system users", { description: response.message });
      return;
    }
    setPage(response.data);
    });
  }, [pageIndex, pageSize, search, roleFilter, activeFilter]);

  useEffect(() => {
    const timer = setTimeout(reloadPage, 250);
    return () => clearTimeout(timer);
  }, [reloadPage]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteSystemUser(deleteTarget.idxno);
    if (!result.success) {
      toast.error("Failed to delete user", { description: result.message });
      return;
    }
    toast.success("User deleted");
    setDeleteTarget(null);
    if (page.content.length === 1 && pageIndex > 0) setPageIndex((current) => current - 1);
    else reloadPage();
    router.refresh();
  };

  const columns = useStaffUserColumns({
    canEdit: canManageUsers && perms.canEdit,
    canDelete: canManageUsers && perms.canDelete,
    onEdit: setSelectedUser,
    onDelete: setDeleteTarget,
  });

  return (
  <div className="space-y-6 p-8 pt-6">
 {/* Page header */}
 <div className="flex items-start justify-between gap-4">
 <div>
 <div className="flex items-center gap-2">
 <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
 <Users className="w-4.5 h-4.5 text-primary" />
 </div>
 <h1 className="text-2xl font-normal tracking-normal">System Users</h1>
 </div>
 <p className="text-sm text-muted-foreground mt-1">
 {page.totalElements} {page.totalElements === 1 ? "user" : "users"} in this scope
 </p>
 </div>
 {perms.canCreate && canManageUsers && (
 <Button onClick={() => requireCompany(() => setSheetOpen(true))} className="gap-2 shrink-0">
 <UserPlus className="w-4 h-4" />
 Add User
 </Button>
 )}
 </div>

 <Separator />

 <DataTable
   columns={columns}
   data={page.content}
   searchPlaceholder="Search by username, name, email, or phone…"
   searchValue={search}
   onSearchChange={(value) => { setSearch(value); setPageIndex(0); }}
   manualPagination
   pageCount={Math.max(1, page.totalPages)}
   pageIndex={pageIndex}
   pageSize={pageSize}
   totalRows={page.totalElements}
   onPaginationChange={(nextPage, nextSize) => {
     if (nextSize !== pageSize) setPageSize(nextSize);
     setPageIndex(nextPage);
   }}
   loading={isPending}
   toolbar={
     <div className="flex items-center gap-2">
       <select
         aria-label="Filter by role"
         value={roleFilter}
         onChange={(event) => { setRoleFilter(event.target.value); setPageIndex(0); }}
         className="h-8 rounded-md border border-input bg-background px-2 text-xs"
       >
         <option value="">All roles</option>
         {roles.filter((role) => !["05", "CUSTOMER"].includes(role.roleCode.toUpperCase())).map((role) => (
           <option key={role.roleCode} value={role.roleCode}>{role.name}</option>
         ))}
       </select>
       <select
         aria-label="Filter by active status"
         value={activeFilter}
         onChange={(event) => { setActiveFilter(event.target.value); setPageIndex(0); }}
         className="h-8 rounded-md border border-input bg-background px-2 text-xs"
       >
         <option value="">All statuses</option>
         <option value="true">Active</option>
         <option value="false">Inactive</option>
       </select>
     </div>
   }
 />

 {/* Sheet */}
 <CreateUserSheet
 open={sheetOpen}
 onClose={() => setSheetOpen(false)}
 onCreated={reloadPage}
 roles={roles}
 companyId={companyCode}
 investors={investors}
 isPlatformAdmin={isPlatformAdmin}
 />

 <EditUserSheet
 key={selectedUser?.idxno ?? "none"}
 open={Boolean(selectedUser)}
 user={selectedUser}
 onClose={() => setSelectedUser(null)}
 onLinked={reloadPage}
 canLinkInvestor={isPlatformAdmin}
 roles={roles}
 />

 <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
   <AlertDialogContent>
     <AlertDialogHeader>
       <AlertDialogTitle>Delete system user?</AlertDialogTitle>
       <AlertDialogDescription>
         {deleteTarget?.fullName || deleteTarget?.username} will be deactivated and removed from normal user lists. Related records will remain.
       </AlertDialogDescription>
     </AlertDialogHeader>
     <AlertDialogFooter>
       <AlertDialogCancel>Cancel</AlertDialogCancel>
       <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
         Delete user
       </AlertDialogAction>
     </AlertDialogFooter>
   </AlertDialogContent>
 </AlertDialog>
 </div>
 );
}
