"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { resetPasswordAction } from "@/actions/auth";

// ── Password strength ───────────────────────────────────────────────────
function getStrength(password: string): number {
 let score = 0;
 if (password.length >= 8) score++;
 if (/[A-Z]/.test(password)) score++;
 if (/[0-9]/.test(password)) score++;
 if (/[^A-Za-z0-9]/.test(password)) score++;
 return score;
}

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColors = ["", "bg-destructive", "bg-warning", "bg-warning", "bg-success"];

// ── Validation ──────────────────────────────────────────────────────────
const validationSchema = Yup.object({
 otp: Yup.string()
 .matches(/^\d{4,8}$/, "Enter the numeric code from your email")
 .required("Reset code is required"),
 password: Yup.string()
 .min(8, "Must be at least 8 characters")
 .matches(/[A-Z]/, "Must include at least one uppercase letter")
 .matches(/[0-9]/, "Must include at least one number")
 .required("Password is required"),
 confirmPassword: Yup.string()
 .oneOf([Yup.ref("password")], "Passwords do not match")
 .required("Please confirm your password"),
});

export default function ResetPasswordForm({ email }: { email: string }) {
 const router = useRouter();
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);
 const [apiError, setApiError] = useState<string | null>(null);
 const [done, setDone] = useState(false);

 const formik = useFormik({
 initialValues: { otp: "", password: "", confirmPassword: "" },
 validationSchema,
 onSubmit: async (values) => {
 setApiError(null);
 const result = await resetPasswordAction({
 email,
 otp: values.otp,
 newPassword: values.password,
 });
 if (result.success) {
 setDone(true);
 setTimeout(() => router.push("/login"), 2000);
 } else {
 setApiError(result.message ?? "Invalid code or something went wrong. Please try again.");
 }
 },
 });

 const strength = getStrength(formik.values.password);

 // ── Success screen ────────────────────────────────────────────────────
 if (done) {
 return (
 <div className="flex flex-col items-center gap-4 py-6 text-center">
 <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
 <CheckCircle2 className="w-7 h-7 text-success" />
 </div>
 <div className="space-y-1">
 <p className="font-semibold text-foreground">Password updated</p>
 <p className="text-sm text-muted-foreground">
 Your password has been reset. Redirecting to login…
 </p>
 </div>
 </div>
 );
 }

 // ── Form ──────────────────────────────────────────────────────────────
 return (
 <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">

 {/* API error banner */}
 {apiError && (
 <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
 <p className="text-sm text-destructive">{apiError}</p>
 </div>
 )}

 {/* OTP */}
 <div className="space-y-2">
 <Label htmlFor="otp">Reset Code</Label>
 <Input
 id="otp"
 type="text"
 inputMode="numeric"
 autoComplete="one-time-code"
 placeholder="Enter the code from your email"
 maxLength={8}
 {...formik.getFieldProps("otp")}
 aria-invalid={formik.touched.otp && !!formik.errors.otp}
 className={cn(
 "tracking-widest font-mono-tech text-center text-lg",
 formik.touched.otp && formik.errors.otp
 ? "border-destructive focus-visible:ring-destructive/30"
 : ""
 )}
 />
 {formik.touched.otp && formik.errors.otp && (
 <p className="text-xs text-destructive">{formik.errors.otp}</p>
 )}
 </div>

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
 className={cn("pr-10", formik.touched.password && formik.errors.password ? "border-destructive focus-visible:ring-destructive/30" : "")}
 />
 <button
 type="button"
 aria-label={showPassword ? "Hide password" : "Show password"}
 onClick={() => setShowPassword((v) => !v)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
 >
 {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>

 {/* Strength bar */}
 {formik.values.password.length > 0 && (
 <div className="space-y-1">
 <div className="flex gap-1">
 {[1, 2, 3, 4].map((i) => (
 <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-300", i <= strength ? strengthColors[strength] : "bg-border")} />
 ))}
 </div>
 <p className={cn("text-xs", strength <= 1 ? "text-destructive" : strength <= 3 ? "text-warning" : "text-success")}>
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
 aria-invalid={formik.touched.confirmPassword && !!formik.errors.confirmPassword}
 className={cn("pr-10", formik.touched.confirmPassword && formik.errors.confirmPassword ? "border-destructive focus-visible:ring-destructive/30" : "")}
 />
 <button
 type="button"
 aria-label={showConfirm ? "Hide password" : "Show password"}
 onClick={() => setShowConfirm((v) => !v)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
 >
 {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 {formik.touched.confirmPassword && formik.errors.confirmPassword && (
 <p className="text-xs text-destructive">{formik.errors.confirmPassword}</p>
 )}
 </div>

 <Button type="submit" className="w-full h-10" disabled={formik.isSubmitting}>
 {formik.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
 </Button>
 </form>
 );
}
