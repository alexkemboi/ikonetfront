"use client";

import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { clearCompanyContextCookie } from "@/lib/companyContextClient";
import {
  determineAccountTypeAction,
  sendSysAdminOtpAction,
  verifySysAdminOtpAction,
} from "@/actions/auth";

const DISMISS_AFTER_MS = 6000;

// ── Auto-dismissing error alert ────────────────────────────────────────
function ErrorAlert({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), DISMISS_AFTER_MS);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          <Alert variant="destructive" className="relative overflow-hidden pr-9 pb-5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{message}</AlertDescription>

            {/* Dismiss button */}
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setVisible(false)}
              className="absolute right-2.5 top-2.5 text-destructive/60 hover:text-destructive transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Shrinking progress bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-destructive/40 rounded-b"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: DISMISS_AFTER_MS / 1000, ease: "linear" }}
            />
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Validation ─────────────────────────────────────────────────────────
const validationSchema = Yup.object({
  username: Yup.string().trim().required("Username is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

// ── Form ───────────────────────────────────────────────────────────────
export default function LoginForm({ error }: { error?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [localError, setLocalError] = useState<string | undefined>(undefined);
  const [accountType, setAccountType] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { username: "", password: "" },
    validationSchema,
    onSubmit: async () => {
      setIsDetecting(true);
      setLocalError(undefined);
      setAccountType(null);

      try {
        const detectRes = await determineAccountTypeAction(
          formik.values.username,
          formik.values.password
        );

        if (!detectRes.success || !detectRes.data) {
          setLocalError(detectRes.message || "Invalid username or password.");
          setIsDetecting(false);
          return;
        }

        const type = detectRes.data.accountType;
        setAccountType(type);

        if (type === "INVALID") {
          setLocalError("Invalid username or password.");
          setIsDetecting(false);
          return;
        }

        if (type === "SYSADMIN") {
          setIsDetecting(false);
          try {
            const otpRes = await sendSysAdminOtpAction(formik.values.username, formik.values.password);
            if (!otpRes.success) {
              setLocalError(otpRes.message || "Failed to send OTP. Please try again.");
              setAccountType(null);
              return;
            }
            setIsOtpSent(true);
          } catch {
            setLocalError("Failed to send OTP. Please try again.");
            setAccountType(null);
          }
          return;
        }

        // CUSTOMER — proceed with NextAuth credentials login
        setIsDetecting(false);
        clearCompanyContextCookie();
        await signIn("credentials", {
          username: formik.values.username,
          password: formik.values.password,
          redirect: true,
          callbackUrl: "/dashboard",
        });
      } catch {
        setLocalError("Something went wrong. Please try again.");
        setIsDetecting(false);
      }
    },
  });

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setLocalError("Please enter the OTP sent to your email.");
      return;
    }

    setIsSubmitting(true);
    setLocalError(undefined);

    try {
      const verifyRes = await verifySysAdminOtpAction(formik.values.username, otp);

      if (!verifyRes.success || !verifyRes.data?.token) {
        setLocalError(verifyRes.message || "Invalid or expired OTP. Please try again.");
        setIsSubmitting(false);
        return;
      }

      await signIn("credentials", {
        username: formik.values.username,
        password: "sysadmin-otp-verified",
        sysadminToken: verifyRes.data.token,
        redirect: true,
        callbackUrl: "/dashboard",
      });
    } catch {
      setLocalError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setIsSubmitting(true);
    setLocalError(undefined);

    try {
      const resendRes = await sendSysAdminOtpAction(formik.values.username, formik.values.password);

      if (!resendRes.success) {
        setLocalError(resendRes.message || "Failed to resend OTP. Please try again.");
      }
    } catch {
      setLocalError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Auth error from URL ?error= param */}
      {error && <ErrorAlert message={error} />}

      {/* Local validation / detection error */}
      {(localError || isDetecting) && (
        <ErrorAlert message={localError || "Detecting account type..."} />
      )}

      <form onSubmit={formik.handleSubmit} className="space-y-5">
        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username">Username / Account Number</Label>
          <Input
            id="username"
            type="text"
            autoComplete="username"
            placeholder="e.g. admin or BSM-00124"
            {...formik.getFieldProps("username")}
            aria-invalid={formik.touched.username && !!formik.errors.username}
            className={
              formik.touched.username && formik.errors.username
                ? "border-destructive focus-visible:ring-destructive/30"
                : ""
            }
            disabled={isDetecting || isSubmitting || accountType === "SYSADMIN"}
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
              aria-invalid={formik.touched.password && !!formik.errors.password}
              className={
                formik.touched.password && formik.errors.password
                  ? "pr-10 border-destructive focus-visible:ring-destructive/30"
                  : "pr-10"
              }
              disabled={isDetecting || isSubmitting || accountType === "SYSADMIN"}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={isDetecting || isSubmitting || accountType === "SYSADMIN"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {formik.touched.password && formik.errors.password && (
            <p className="text-xs text-destructive">{formik.errors.password}</p>
          )}
        </div>

        {/* OTP step for sysadmin */}
        {accountType === "SYSADMIN" && (
          <div className="space-y-2">
            <Label htmlFor="otp">Enter OTP</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              placeholder="Enter the 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 10))}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              {isOtpSent
                ? "Enter the OTP sent to your registered email."
                : "Enter the OTP sent to your registered email."}
            </p>
          </div>
        )}

        {/* Submit / Actions */}
        {accountType === "SYSADMIN" ? (
          <div className="space-y-2">
            <Button
              type="button"
              className="w-full h-10 bg-warning text-warning-foreground hover:bg-warning/90"
              disabled={isSubmitting}
              onClick={handleOtpSubmit}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Verify OTP & Sign In"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full h-10"
              disabled={isSubmitting}
              onClick={handleResendOtp}
            >
              Resend OTP
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full"
              disabled={isSubmitting}
              onClick={() => {
                setAccountType(null);
                setOtp("");
                setIsOtpSent(false);
                setLocalError(undefined);
              }}
            >
              Back to login
            </Button>
          </div>
        ) : (
          <Button
            type="submit"
            className="w-full h-10 bg-warning text-warning-foreground hover:bg-warning/90"
            disabled={formik.isSubmitting || isDetecting}
          >
            {(formik.isSubmitting || isDetecting) ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Sign In"
            )}
          </Button>
        )}
      </form>
    </div>
  );
}
