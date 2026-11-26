"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Loader2, Mail, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { reloadIfStaleBuild } from "@/lib/staleBuild";

const CODE_LENGTH = 6;

export type OtpVerifyResult = { ok: true } | { ok: false; message: string; final?: boolean };
export type OtpResendResult =
  | { ok: true; expiresInSeconds: number; resendInSeconds: number }
  | { ok: false; message: string; final?: boolean };

type Props = {
  /** Where the code went, already masked by the server. */
  maskedEmail?: string;
  /** Seconds the current code stays valid (server-provided). */
  expiresInSeconds: number;
  /** Seconds before a new code may be requested (server-provided). */
  resendInSeconds: number;
  onVerify: (code: string) => Promise<OtpVerifyResult>;
  onResend: () => Promise<OtpResendResult>;
  onBack: () => void;
};

type Notice = { tone: "error" | "success" | "info"; text: string } | null;

function formatClock(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Seconds left until `deadline` (epoch ms), ticking once a second. */
function useSecondsUntil(deadline: number) {
  const left = () => Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  const [seconds, setSeconds] = useState(left);
  useEffect(() => {
    setSeconds(left());
    const timer = setInterval(() => setSeconds(left()), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);
  return seconds;
}

/**
 * Second sign-in step: the six-digit code emailed after the password was accepted.
 * The code lives only in component state (never in storage); a refresh returns to the
 * password step because no session exists until the server accepts the code.
 */
export default function OtpVerification({
  maskedEmail,
  expiresInSeconds,
  resendInSeconds,
  onVerify,
  onResend,
  onBack,
}: Props) {
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const [expiresAt, setExpiresAt] = useState(() => Date.now() + expiresInSeconds * 1000);
  const [resendAt, setResendAt] = useState(() => Date.now() + resendInSeconds * 1000);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [ended, setEnded] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const secondsLeft = useSecondsUntil(expiresAt);
  const resendWait = useSecondsUntil(resendAt);
  const expired = secondsLeft === 0;
  const code = digits.join("");
  const complete = code.length === CODE_LENGTH && /^\d+$/.test(code);
  const locked = verifying || verified || ended || expired;

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const focusBox = (index: number) => {
    const box = inputs.current[Math.max(0, Math.min(CODE_LENGTH - 1, index))];
    box?.focus();
    box?.select();
  };

  const fillFrom = (start: number, text: string) => {
    const incoming = text.replace(/\D/g, "").slice(0, CODE_LENGTH - start).split("");
    if (!incoming.length) return;
    setDigits((prev) => {
      const next = [...prev];
      incoming.forEach((d, i) => (next[start + i] = d));
      return next;
    });
    setNotice((n) => (n?.tone === "error" ? null : n));
    focusBox(start + incoming.length);
  };

  const handleChange = (index: number, value: string) => {
    if (value === "") {
      setDigits((prev) => prev.map((d, i) => (i === index ? "" : d)));
      return;
    }
    // typing over a filled box: keep only the new digit, not old + new
    const current = digits[index];
    fillFrom(index, current && value.length === 2 && value.startsWith(current) ? value.slice(1) : value);
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      setDigits((prev) => prev.map((d, i) => (i === index - 1 ? "" : d)));
      focusBox(index - 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusBox(index + 1);
    }
  };

  const clearDigits = () => {
    setDigits(Array(CODE_LENGTH).fill(""));
    setTimeout(() => focusBox(0), 0);
  };

  const submit = useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault();
      if (locked) return;
      if (!complete) {
        setNotice({ tone: "error", text: "Enter all 6 digits of the code from the email." });
        return;
      }
      setVerifying(true);
      setNotice(null);
      try {
        const result = await onVerify(code);
        if (result.ok) {
          setVerified(true);
          setNotice({ tone: "success", text: "Code verified. Signing you in…" });
          return;
        }
        setNotice({ tone: "error", text: result.message });
        if (result.final) setEnded(true);
        else clearDigits();
      } catch (error) {
        if (reloadIfStaleBuild(error)) return;
        setNotice({ tone: "error", text: "Something went wrong. Please try again." });
      } finally {
        setVerifying(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [code, complete, locked, onVerify]
  );

  const resend = async () => {
    if (resending || verified || ended || resendWait > 0) return;
    setResending(true);
    setNotice(null);
    try {
      const result = await onResend();
      if (result.ok) {
        setExpiresAt(Date.now() + result.expiresInSeconds * 1000);
        setResendAt(Date.now() + result.resendInSeconds * 1000);
        clearDigits();
        setNotice({ tone: "info", text: "A new code is on its way. The previous code no longer works." });
      } else {
        setNotice({ tone: "error", text: result.message });
        if (result.final) setEnded(true);
      }
    } catch (error) {
      if (reloadIfStaleBuild(error)) return;
      setNotice({ tone: "error", text: "Could not send a new code. Please try again." });
    } finally {
      setResending(false);
    }
  };

  const urgent = !expired && secondsLeft <= 60;

  return (
    <form method="post" onSubmit={submit} className="space-y-5" noValidate aria-describedby="otp-help">
      <div className="rounded-2xl border border-primary/30 bg-card p-5 shadow-xs space-y-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-base font-medium text-foreground">Check your email</p>
            <p id="otp-help" className="text-sm text-muted-foreground">
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground break-all">{maskedEmail || "the email address on this account"}</span>.
              Enter it below to finish signing in.
            </p>
          </div>
        </div>

        <fieldset disabled={locked} className="space-y-2">
          <legend className="sr-only">Sign-in code</legend>
          <div className="flex justify-between gap-1.5 sm:gap-2.5" onPaste={(e) => {
            e.preventDefault();
            const at = inputs.current.findIndex((el) => el === document.activeElement);
            fillFrom(at < 0 ? 0 : at, e.clipboardData.getData("text"));
          }}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                aria-label={`Digit ${i + 1} of ${CODE_LENGTH}`}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={CODE_LENGTH}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                className={cn(
                  "h-12 w-full min-w-0 max-w-14 rounded-xl border bg-background text-center text-xl font-semibold tabular-nums text-foreground shadow-xs outline-none transition-[color,box-shadow,border-color] sm:h-14 sm:text-2xl",
                  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  notice?.tone === "error" && !digit ? "border-destructive/60" : "border-input",
                  verified && "border-success text-success"
                )}
              />
            ))}
          </div>
        </fieldset>

        <div
          className={cn(
            "flex items-center gap-2 text-sm",
            expired ? "text-destructive" : urgent ? "text-warning" : "text-muted-foreground"
          )}
          role="timer"
          aria-live="off"
        >
          <Clock className="h-4 w-4 shrink-0" aria-hidden />
          {expired ? (
            <span>This code has expired. Ask for a new code below.</span>
          ) : (
            <span>
              Code expires in <span className="font-medium tabular-nums">{formatClock(secondsLeft)}</span>
            </span>
          )}
        </div>

        <div aria-live="polite" className="empty:hidden">
          {notice && (
            <Alert
              variant={notice.tone === "error" ? "destructive" : "default"}
              className={cn(
                notice.tone === "success" && "border-success/40 text-success [&>svg]:text-success",
                notice.tone === "info" && "border-primary/30"
              )}
            >
              {notice.tone === "error" ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <AlertDescription className="text-sm">{notice.text}</AlertDescription>
            </Alert>
          )}
        </div>

        <Button type="submit" className="h-12 w-full gap-2 rounded-full text-base" disabled={locked || !complete}>
          {verifying || verified ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {verified ? "Signing in…" : "Verifying…"}
            </>
          ) : (
            "Verify code"
          )}
        </Button>

        <div className="flex flex-col-reverse items-center justify-between gap-3 text-sm sm:flex-row">
          <button
            type="button"
            onClick={onBack}
            disabled={verifying || verified}
            className="inline-flex items-center gap-1.5 text-muted-foreground underline-offset-4 hover:text-primary hover:underline disabled:opacity-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to sign in
          </button>
          <button
            type="button"
            onClick={resend}
            disabled={resending || verified || ended || resendWait > 0}
            className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
          >
            {resending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <RotateCw className="h-3.5 w-3.5" aria-hidden />
            )}
            {resending ? "Sending…" : resendWait > 0 ? `Resend code in ${resendWait}s` : "Resend code"}
          </button>
        </div>
      </div>
    </form>
  );
}
