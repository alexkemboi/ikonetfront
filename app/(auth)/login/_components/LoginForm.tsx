"use client";

import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { clearCompanyContextCookie } from "@/lib/companyContextClient";
import { signInAction, signInCodeAction } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/lib/useHydrated";

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
  username: Yup.string().trim().required("Enter your username, email or phone number"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

// ── Form ───────────────────────────────────────────────────────────────
/**
 * One sign-in for everyone. The server works out from the username and password whether the
 * account is a platform administrator, company staff, an investor or a customer; the role in
 * the token then decides where the dashboard sends them.
 */
export default function LoginForm({ error }: { error?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const ready = useHydrated();
  const [localError, setLocalError] = useState<string | undefined>(undefined);
  // set when the password was accepted and the server emailed a sign-in code
  const [codeStep, setCodeStep] = useState<{ username: string; role?: string } | null>(null);
  const [code, setCode] = useState("");

  const finish = async (username: string, token: string) => {
    clearCompanyContextCookie();
    await signIn("credentials", {
      username,
      verifiedToken: token,
      redirect: true,
      callbackUrl: "/dashboard",
    });
  };

  const submitCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!codeStep) return;
    const typed = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(typed)) {
      setLocalError("Enter the 6-digit code from the email.");
      return;
    }
    setLocalError(undefined);
    setBusy(true);
    try {
      const res = await signInCodeAction(codeStep.username, typed, codeStep.role);
      if (!res.success || !res.data?.token) {
        setLocalError(res.message || "The sign-in code is not correct.");
        return;
      }
      await finish(res.data.username || codeStep.username, res.data.token);
    } catch {
      setLocalError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const formik = useFormik({
    initialValues: { username: "", password: "" },
    validationSchema,
    onSubmit: async (values) => {
      setLocalError(undefined);
      setBusy(true);
      try {
        const username = values.username.trim();
        const res = await signInAction(username, values.password);
        if (res.success && res.data?.codeRequired) {
          setCode("");
          setCodeStep({ username: res.data.username || username, role: res.data.role });
          return;
        }
        if (!res.success || !res.data?.token) {
          setLocalError(res.message || "Invalid username or password.");
          return;
        }
        await finish(res.data.username || username, res.data.token);
      } catch {
        setLocalError("Something went wrong. Please try again.");
      } finally {
        setBusy(false);
      }
    },
  });

  const usernameError = formik.touched.username ? formik.errors.username : undefined;
  const passwordError = formik.touched.password ? formik.errors.password : undefined;

  if (codeStep) {
    return (
      <form method="post" onSubmit={submitCode} className="space-y-4" noValidate>
        {localError && <ErrorAlert message={localError} />}
        <div className="space-y-1">
          <p className="text-sm font-medium">Check your email</p>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit sign-in code to the email address on this account. It expires in 10 minutes.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signin-code">Sign-in code</Label>
          <Input
            id="signin-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={busy}
            autoFocus
            className="h-11 tracking-widest"
          />
        </div>
        <Button type="submit" className="h-11 w-full" disabled={busy || !ready}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
        </Button>
        <button
          type="button"
          className="w-full text-sm text-muted-foreground hover:underline"
          onClick={() => {
            setCodeStep(null);
            setLocalError(undefined);
          }}
        >
          Back: sign in again to get a new code
        </button>
      </form>
    );
  }

  return (
    <form method="post" onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
      {/* Auth error from URL ?error= param */}
      {error && <ErrorAlert message={error} />}
      {localError && <ErrorAlert message={localError} />}

      <div className="rounded-2xl border border-primary/30 bg-card p-5 shadow-xs space-y-4">
        {/* Username */}
        <div className="space-y-1.5">
          <Label htmlFor="username">Username, email or account number</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="e.g. jane.doe, name@company.com or BSM-00124"
              {...formik.getFieldProps("username")}
              aria-invalid={!!usernameError}
              className={cn("h-11 pl-9", usernameError && "border-destructive focus-visible:ring-destructive/30")}
              disabled={busy}
            />
          </div>
          {usernameError && <p className="text-xs text-destructive">{usernameError}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              {...formik.getFieldProps("password")}
              aria-invalid={!!passwordError}
              className={cn("h-11 pl-9 pr-10", passwordError && "border-destructive focus-visible:ring-destructive/30")}
              disabled={busy}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={busy}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
        </div>

        <Button type="submit" className="h-12 w-full gap-2 rounded-full text-base" disabled={busy || !ready}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
        </Button>

        <p className="text-center">
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-primary"
          >
            Forgot your password?
          </Link>
        </p>
      </div>
    </form>
  );
}
