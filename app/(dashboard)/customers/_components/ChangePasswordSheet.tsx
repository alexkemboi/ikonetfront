"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { changeCustomerPassword } from "@/actions/customer";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closePasswordSheet } from "@/store/slices/customerslice";
import { Customer } from "@/lib/types/customer";
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

interface ChangePasswordSheetProps {
 customers: Customer[];
}

const changePasswordValidationSchema = Yup.object({
 newPassword: Yup.string()
 .required("New password is required")
 .min(6, "Password must be at least 6 characters"),
 confirmPassword: Yup.string()
 .required("Please confirm your password")
 .oneOf([Yup.ref("newPassword")], "Passwords must match"),
});

export function ChangePasswordSheet({ customers }: ChangePasswordSheetProps) {
 const dispatch = useAppDispatch();
 const passwordSheetCustomerId = useAppSelector(
 (state) => state.customer.passwordSheetCustomerId
 );

 const activeCustomer = customers.find(
 (c) => c.userIdxno === passwordSheetCustomerId
 );

 const formik = useFormik({
 initialValues: { newPassword: "", confirmPassword: "" },
 validationSchema: changePasswordValidationSchema,
 onSubmit: async (values, { setSubmitting, resetForm }) => {
 if (!passwordSheetCustomerId) return;
 try {
 const result = await changeCustomerPassword(
 passwordSheetCustomerId,
 values.newPassword
 );
 if (result.success) {
 toast.success("Password changed successfully!");
 dispatch(closePasswordSheet());
 resetForm();
 } else {
 toast.error(result.message || "Failed to change password.");
 }
 } catch {
 toast.error("An unexpected error occurred.");
 } finally {
 setSubmitting(false);
 }
 },
 });

 function handleSheetOpenChange(open: boolean) {
 if (!open) {
 dispatch(closePasswordSheet());
 formik.resetForm();
 }
 }

 return (
 <Sheet
 open={passwordSheetCustomerId !== null}
 onOpenChange={handleSheetOpenChange}
 >
 <SheetContent side="right" className="w-full sm:max-w-md">
 <SheetHeader className="mb-6">
 <SheetTitle>Change PPPoE Password</SheetTitle>
 <SheetDescription>
 {activeCustomer
 ? `Change password for ${activeCustomer.fullName} (@${activeCustomer.username})`
 : "Change customer password"}
 </SheetDescription>
 </SheetHeader>

 <form onSubmit={formik.handleSubmit} className="space-y-5">
 <div className="space-y-2">
 <Label htmlFor="newPassword">New Password</Label>
 <Input
 id="newPassword"
 type="password"
 placeholder="Enter new password"
 {...formik.getFieldProps("newPassword")}
 className={
 formik.touched.newPassword && formik.errors.newPassword
 ? "border-destructive"
 : ""
 }
 />
 {formik.touched.newPassword && formik.errors.newPassword && (
 <p className="text-xs text-destructive">{formik.errors.newPassword}</p>
 )}
 </div>

 <div className="space-y-2">
 <Label htmlFor="confirmPassword">Confirm Password</Label>
 <Input
 id="confirmPassword"
 type="password"
 placeholder="Confirm new password"
 {...formik.getFieldProps("confirmPassword")}
 className={
 formik.touched.confirmPassword && formik.errors.confirmPassword
 ? "border-destructive"
 : ""
 }
 />
 {formik.touched.confirmPassword && formik.errors.confirmPassword && (
 <p className="text-xs text-destructive">
 {formik.errors.confirmPassword}
 </p>
 )}
 </div>

 <SheetFooter className="flex gap-2 pt-4">
 <Button
 type="button"
 variant="outline"
 onClick={() => handleSheetOpenChange(false)}
 >
 Cancel
 </Button>
 <Button type="submit" disabled={formik.isSubmitting}>
 {formik.isSubmitting ? "Saving..." : "Change Password"}
 </Button>
 </SheetFooter>
 </form>
 </SheetContent>
 </Sheet>
 );
}
