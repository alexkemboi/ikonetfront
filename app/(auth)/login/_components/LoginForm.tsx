"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
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
import {
  determineAccountTypeAction,
  sysAdminLoginAction,
} from "@/actions/auth";
import { resolveOrganisationAction, type OrganisationMatch } from "@/actions/branding";
import { cn } from "@/lib/utils";

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

/** Company accounts name their organisation; platform administrators belong to none. */
type SignInMode = "company" | "platform";

type OrganisationState =
  | { status: "idle" | "checking" | "unknown" }
  | { status: "found"; match: OrganisationMatch };

const REMEMBERED_ORGANISATION_KEY = "ibs_login_organisation";

function readRememberedOrganisation(): string {
  try {
    return window.localStorage.getItem(REMEMBERED_ORGANISATION_KEY) ?? "";
  } catch {
    return "";
  }
}

function rememberOrganisation(value: string | null) {
  try {
    if (value) window.localStorage.setItem(REMEMBERED_ORGANISATION_KEY, value);
    else window.localStorage.removeItem(REMEMBERED_ORGANISATION_KEY);
  } catch {
    // Storage unavailable (private window): the field simply starts empty next time.
  }
}

const MODES: { id: SignInMode; label: string; icon: typeof Building2; hint: string }[] = [
  {
    id: "company",
    label: "Company account",
    icon: Building2,
    hint: "Staff, customers and network partners of the organisation above.",
  },
  {
    id: "platform",
    label: "Platform admin",
    icon: ShieldCheck,
    hint: "System administrators work across all companies and need no organisation.",
  },
];

// ── Form ───────────────────────────────────────────────────────────────
export default function LoginForm({
  error,
  hostOrganisation,
}: {
  error?: string;
  /** Set when the web address itself (subdomain or custom domain) names the company. */
  hostOrganisation?: OrganisationMatch | null;
}) {
  const [mode, setMode] = useState<SignInMode>("company");
  const [organisationInput, setOrganisationInput] = useState("");
  const [organisation, setOrganisation] = useState<OrganisationState>(
    hostOrganisation ? { status: "found", match: hostOrganisation } : { status: "idle" }
  );
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | undefined>(undefined);
  // Ignore the answer to a lookup the user has already typed past.
  const lookup = useRef(0);

  const resolveOrganisation = useCallback(async (value: string): Promise<OrganisationMatch | null> => {
    const typed = value.trim();
    if (!typed) {
      setOrganisation({ status: "idle" });
      return null;
    }
    const id = ++lookup.current;
    setOrganisation({ status: "checking" });
    const match = await resolveOrganisationAction(typed).catch(() => null);
    if (id === lookup.current) {
      setOrganisation(match ? { status: "found", match } : { status: "unknown" });
    }
    return match;
  }, []);

  useEffect(() => {
    if (hostOrganisation) return;
    const remembered = readRememberedOrganisation();
    if (!remembered) return;
    setOrganisationInput(remembered);
    void resolveOrganisation(remembered);
  }, [hostOrganisation, resolveOrganisation]);

  const formik = useFormik({
    initialValues: { username: "", password: "" },
    validationSchema,
    onSubmit: async (values) => {
      setLocalError(undefined);
      setBusy(true);
      try {
        // Company accounts must name a known organisation before any credential is sent.
        let company: OrganisationMatch | null = null;
        if (mode === "company") {
          company =
            hostOrganisation ??
            (organisation.status === "found" ? organisation.match : await resolveOrganisation(organisationInput));
          if (!company) {
            setLocalError(
              organisationInput.trim()
                ? "We could not find that organisation. Check the short name or code and try again."
                : "Enter your organisation to continue."
            );
            return;
          }
        }

        const detectRes = await determineAccountTypeAction(values.username, values.password);
        const type = detectRes.success ? detectRes.data?.accountType : undefined;
        if (!type || type === "INVALID") {
          setLocalError(detectRes.success ? "Invalid username or password." : detectRes.message || "Invalid username or password.");
          return;
        }

        if (type === "SYSADMIN") {
          // A system administrator is let in from either tab; the organisation does not apply.
          const sysRes = await sysAdminLoginAction(values.username, values.password);
          if (!sysRes.success || !sysRes.data?.token) {
            setLocalError(sysRes.message || "SysAdmin login failed. Please try again.");
            return;
          }
          clearCompanyContextCookie();
          await signIn("credentials", {
            username: values.username,
            password: "sysadmin-otp-verified",
            sysadminToken: sysRes.data.token,
            redirect: true,
            callbackUrl: "/dashboard",
          });
          return;
        }

        if (mode === "platform" || !company) {
          setLocalError("This account belongs to a company. Use the Company account tab and enter your organisation.");
          return;
        }

        if (!hostOrganisation) rememberOrganisation(remember ? organisationInput.trim() : null);
        clearCompanyContextCookie();
        await signIn("credentials", {
          username: values.username,
          password: values.password,
          organisation: company.code,
          redirect: true,
          callbackUrl: "/dashboard",
        });
      } catch {
        setLocalError("Something went wrong. Please try again.");
      } finally {
        setBusy(false);
      }
    },
  });

  const organisationDisabled = busy || mode === "platform";
  const usernameError = formik.touched.username ? formik.errors.username : undefined;
  const passwordError = formik.touched.password ? formik.errors.password : undefined;
  const activeMode = MODES.find((m) => m.id === mode) ?? MODES[0];

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
      {/* Auth error from URL ?error= param */}
      {error && <ErrorAlert message={error} />}
      {localError && <ErrorAlert message={localError} />}

      {/* Organisation */}
      <div className="space-y-1.5">
        <Label htmlFor="organisation">Organisation</Label>
        {hostOrganisation ? (
          <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium">{hostOrganisation.name}</span>
          </div>
        ) : (
          <>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="organisation"
                type="text"
                autoComplete="organization"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="e.g. bedak"
                value={mode === "platform" ? "" : organisationInput}
                onChange={(e) => {
                  lookup.current += 1;
                  setOrganisationInput(e.target.value);
                  setOrganisation({ status: "idle" });
                }}
                onBlur={() => void resolveOrganisation(organisationInput)}
                disabled={organisationDisabled}
                aria-describedby="organisation-help"
                aria-invalid={organisation.status === "unknown"}
                className={cn("pl-9 pr-9", organisation.status === "unknown" && mode === "company" && "border-destructive")}
              />
              {mode === "company" && organisation.status === "checking" && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
              {mode === "company" && organisation.status === "found" && (
                <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-success" />
              )}
            </div>
            <p id="organisation-help" className="text-xs text-muted-foreground" aria-live="polite">
              {mode === "platform"
                ? "Not needed for platform administrators."
                : organisation.status === "found"
                  ? <>Signing in to <span className="font-medium text-foreground">{organisation.match.name}</span>.</>
                  : organisation.status === "unknown"
                    ? <span className="text-destructive">No organisation with that short name or code.</span>
                    : "The short name or code your company was set up under."}
            </p>
          </>
        )}
      </div>

      {/* Sign-in card */}
      <div className="rounded-2xl border border-primary/30 bg-card p-5 shadow-xs space-y-4">
        <div role="tablist" aria-label="Account type" className="grid grid-cols-2 border-b border-border">
          {MODES.map((m) => {
            const Icon = m.icon;
            const selected = m.id === mode;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                id={`signin-tab-${m.id}`}
                aria-selected={selected}
                aria-controls="signin-panel"
                disabled={busy}
                onClick={() => {
                  setMode(m.id);
                  setLocalError(undefined);
                }}
                className={cn(
                  "-mb-px flex items-center justify-center gap-2 border-b-2 px-2 py-2.5 text-sm transition-colors",
                  selected
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {m.label}
              </button>
            );
          })}
        </div>

        <div id="signin-panel" role="tabpanel" aria-labelledby={`signin-tab-${mode}`} className="space-y-4">
          <p className="text-xs text-muted-foreground">{activeMode.hint}</p>

          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="username">{mode === "platform" ? "Username" : "Username or account number"}</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={mode === "platform" ? "e.g. sysadmin" : "e.g. jane.doe or BSM-00124"}
                {...formik.getFieldProps("username")}
                aria-invalid={!!usernameError}
                className={cn("pl-9", usernameError && "border-destructive focus-visible:ring-destructive/30")}
                disabled={busy}
              />
            </div>
            {usernameError ? (
              <p className="text-xs text-destructive">{usernameError}</p>
            ) : (
              mode === "company" && (
                <p className="text-xs text-muted-foreground">
                  Staff use their username; customers use their account number.
                </p>
              )
            )}
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
                className={cn("pl-9 pr-10", passwordError && "border-destructive focus-visible:ring-destructive/30")}
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

          {mode === "company" && !hostOrganisation && (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={busy}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              Remember my organisation on this device
            </label>
          )}

          <Button type="submit" className="w-full h-10 gap-2" disabled={busy}>
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <activeMode.icon className="h-4 w-4" />
                {mode === "platform" ? "Sign in as administrator" : "Sign in"}
              </>
            )}
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
      </div>
    </form>
  );
}
