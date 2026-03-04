"use client";

import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { signIn } from "next-auth/react";

const validationSchema = Yup.object({
  username: Yup.string().trim().required("Username is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema,
    onSubmit: async (_values) => {
      // Logic to be implemented by developer
      // Placeholder to show loading state
      await signIn("credentials", {
        username: formik.values.username,
        password: formik.values.password,
        redirect: true,
        callbackUrl: "/settings/access", // Redirect to profile after login (can be changed as needed)
      })
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">
      {/* Username */}
      <div className="space-y-2">
        <Label htmlFor="username">Username / Account Number</Label>
        <Input
          id="username"
          type="text"
          autoComplete="username"
          placeholder="e.g. admin or BSM-00124"
          {...formik.getFieldProps("username")}
          aria-invalid={
            formik.touched.username && !!formik.errors.username
          }
          className={
            formik.touched.username && formik.errors.username
              ? "border-destructive focus-visible:ring-destructive/30"
              : ""
          }
        />
        {formik.touched.username && formik.errors.username && (
          <p className="text-xs text-destructive">{formik.errors.username}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            tabIndex={-1}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-primary"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            {...formik.getFieldProps("password")}
            aria-invalid={
              formik.touched.password && !!formik.errors.password
            }
            className={
              formik.touched.password && formik.errors.password
                ? "pr-10 border-destructive focus-visible:ring-destructive/30"
                : "pr-10"
            }
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
        {formik.touched.password && formik.errors.password && (
          <p className="text-xs text-destructive">{formik.errors.password}</p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-10 bg-warning text-warning-foreground hover:bg-warning/90"
        disabled={formik.isSubmitting}
      >
        {formik.isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
}
