"use client";

import Link from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const validationSchema = Yup.object({
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
});

export default function ForgotPasswordForm() {
  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema,
    onSubmit: async (_values) => {
      // Logic to be implemented by developer
      await new Promise((r) => setTimeout(r, 600));
    },
  });

  if (formik.submitCount > 0 && !formik.isSubmitting && formik.isValid) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
          <MailCheck className="w-6 h-6 text-success" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-foreground">Check your inbox</p>
          <p className="text-sm text-muted-foreground">
            If an account exists for{" "}
            <span className="font-medium text-foreground">
              {formik.values.email}
            </span>
            , a reset link has been sent.
          </p>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Return to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...formik.getFieldProps("email")}
          aria-invalid={formik.touched.email && !!formik.errors.email}
          className={
            formik.touched.email && formik.errors.email
              ? "border-destructive focus-visible:ring-destructive/30"
              : ""
          }
        />
        {formik.touched.email && formik.errors.email && (
          <p className="text-xs text-destructive">{formik.errors.email}</p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-10"
        disabled={formik.isSubmitting}
      >
        {formik.isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "Send Reset Link"
        )}
      </Button>
    </form>
  );
}
