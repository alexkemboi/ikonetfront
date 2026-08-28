"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Loader2, MailCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction } from "@/actions/auth";

const RESEND_COOLDOWN = 30; // seconds

const validationSchema = Yup.object({
 email: Yup.string()
 .email("Please enter a valid email address")
 .required("Email is required"),
});

export default function ForgotPasswordForm() {
 const router = useRouter();
 const [sentTo, setSentTo] = useState<string | null>(null);
 const [cooldown, setCooldown] = useState(0);
 const [resending, setResending] = useState(false);

 // Countdown timer after code is sent
 useEffect(() => {
 if (cooldown <= 0) return;
 const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
 return () => clearTimeout(timer);
 }, [cooldown]);

 const formik = useFormik({
 initialValues: { email: "" },
 validationSchema,
 onSubmit: async (values) => {
 const result = await forgotPasswordAction(values.email);
 if (result.success) {
 setSentTo(values.email);
 setCooldown(RESEND_COOLDOWN);
 } else {
 formik.setFieldError("email", result.message ?? "Something went wrong. Please try again.");
 }
 },
 });

 async function handleResend() {
 if (!sentTo || cooldown > 0 || resending) return;
 setResending(true);
 try {
 const result = await forgotPasswordAction(sentTo);
 if (result.success) setCooldown(RESEND_COOLDOWN);
 } finally {
 setResending(false);
 }
 }

 // ── Step 2: code sent ─────────────────────────────────────────────────
 if (sentTo) {
 return (
 <div className="space-y-6">
 <div className="flex flex-col items-center gap-3 py-4 text-center">
 <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
 <MailCheck className="w-7 h-7 text-success" />
 </div>
 <div className="space-y-1">
 <p className="font-semibold text-foreground">Check your email</p>
 <p className="text-sm text-muted-foreground">
 We sent a reset code to{" "}
 <span className="font-medium text-foreground">{sentTo}</span>.
 Enter it on the next screen.
 </p>
 </div>
 </div>

 <Button
 className="w-full gap-2"
 onClick={() => router.push(`/reset-password?email=${encodeURIComponent(sentTo)}`)}
 >
 Continue <ArrowRight className="w-4 h-4" />
 </Button>

 <div className="text-center space-y-2">
 <p className="text-sm text-muted-foreground">
 Didn&apos;t receive it?{" "}
 <button
 type="button"
 onClick={handleResend}
 disabled={cooldown > 0 || resending}
 className="font-medium text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {resending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
 </button>
 </p>
 <Link href="/login" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
 Back to login
 </Link>
 </div>
 </div>
 );
 }

 // ── Step 1: email form ────────────────────────────────────────────────
 return (
 <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">
 <div className="space-y-2">
 <Label htmlFor="email">Email Address</Label>
 <Input
 id="email"
 type="email"
 autoComplete="email"
 placeholder="you@example.com"
 {...formik.getFieldProps("email")}
 aria-invalid={formik.touched.email && !!formik.errors.email}
 className={formik.touched.email && formik.errors.email ? "border-destructive focus-visible:ring-destructive/30" : ""}
 />
 {formik.touched.email && formik.errors.email && (
 <p className="text-xs text-destructive">{formik.errors.email}</p>
 )}
 </div>

 <Button type="submit" className="w-full h-10" disabled={formik.isSubmitting}>
 {formik.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Code"}
 </Button>
 </form>
 );
}
