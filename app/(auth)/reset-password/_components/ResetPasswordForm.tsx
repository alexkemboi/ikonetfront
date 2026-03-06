"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const validationSchema = Yup.object({
  password: Yup.string()
    .min(8, "Must be at least 8 characters")
    .matches(/[A-Z]/, "Must include at least one uppercase letter")
    .matches(/[0-9]/, "Must include at least one number")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});

function getStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score; // 0-4
}

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColors = [
  "",
  "bg-destructive",
  "bg-warning",
  "bg-warning",
  "bg-success",
];

export default function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const formik = useFormik({
    initialValues: { password: "", confirmPassword: "" },
    validationSchema,
    onSubmit: async (_values) => {
      // Logic to be implemented by developer
      await new Promise((r) => setTimeout(r, 600));
    },
  });

  const strength = getStrength(formik.values.password);

  if (formik.submitCount > 0 && !formik.isSubmitting && formik.isValid) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-success" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-foreground">Password updated</p>
          <p className="text-sm text-muted-foreground">
            Your password has been reset successfully.
          </p>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in with new password
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">
      {/* New Password */}
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            {...formik.getFieldProps("password")}
            aria-invalid={formik.touched.password && !!formik.errors.password}
            className={cn(
              "pr-10",
              formik.touched.password && formik.errors.password
                ? "border-destructive focus-visible:ring-destructive/30"
                : ""
            )}
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Strength bar */}
        {formik.values.password.length > 0 && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-300",
                    i <= strength
                      ? strengthColors[strength]
                      : "bg-border"
                  )}
                />
              ))}
            </div>
            <p
              className={cn(
                "text-xs",
                strength <= 1
                  ? "text-destructive"
                  : strength <= 3
                  ? "text-warning"
                  : "text-success"
              )}
            >
              {strengthLabels[strength]}
            </p>
          </div>
        )}

        {formik.touched.password && formik.errors.password && (
          <p className="text-xs text-destructive">{formik.errors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            {...formik.getFieldProps("confirmPassword")}
            aria-invalid={
              formik.touched.confirmPassword && !!formik.errors.confirmPassword
            }
            className={cn(
              "pr-10",
              formik.touched.confirmPassword && formik.errors.confirmPassword
                ? "border-destructive focus-visible:ring-destructive/30"
                : ""
            )}
          />
          <button
            type="button"
            aria-label={showConfirm ? "Hide password" : "Show password"}
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirm ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {formik.touched.confirmPassword && formik.errors.confirmPassword && (
          <p className="text-xs text-destructive">
            {formik.errors.confirmPassword}
          </p>
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
          "Update Password"
        )}
      </Button>
    </form>
  );
}
