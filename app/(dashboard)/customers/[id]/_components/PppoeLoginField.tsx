"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import { revealPppoePassword, type PppoeCredentials } from "@/actions/customer";
import { useStepUp } from "@/providers/StepUpProvider";

/** Shown passwords mask themselves again after this long. */
const REMASK_AFTER_MS = 30_000;

const MASK = "••••••••••";

/**
 * The customer's PPPoE username and password, masked until staff choose to
 * see them. Unmasking asks staff to re-enter their own password first (step-up,
 * valid for a few minutes); the password is only requested then (each request
 * is audit-logged by the backend) and is dropped again when masked.
 */
export function PppoeLoginField({ customerId, username }: { customerId: number; username: string }) {
  const [credentials, setCredentials] = useState<PppoeCredentials | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { requestStepUp } = useStepUp();

  useEffect(() => {
    if (!credentials) return;
    const timer = setTimeout(() => setCredentials(null), REMASK_AFTER_MS);
    return () => clearTimeout(timer);
  }, [credentials]);

  async function toggle() {
    if (credentials) {
      setCredentials(null);
      return;
    }
    const stepUpToken = await requestStepUp("Confirm your password to see this customer's PPPoE password.");
    // null: the prompt was cancelled; "pending": it closed without a verified password
    if (!stepUpToken || stepUpToken === "pending") return;
    setLoading(true);
    const res = await revealPppoePassword(customerId, stepUpToken);
    setLoading(false);
    if (!res.success || !res.data) {
      toast.error("Could not show the password", { description: res.message });
      return;
    }
    setCredentials(res.data);
  }

  async function copy() {
    if (!credentials) return;
    try {
      await navigator.clipboard.writeText(credentials.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy is not available here. Select the password instead.");
    }
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">PPPoE login</p>
      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground">Username</p>
          <p className="truncate text-sm font-semibold font-mono">{credentials?.username ?? username}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground">Password</p>
          <div className="flex items-center gap-1">
            <p
              className="min-w-0 flex-1 truncate text-sm font-semibold font-mono select-all"
              aria-live="polite"
              aria-label={credentials ? "PPPoE password" : "PPPoE password, hidden"}
            >
              {credentials ? credentials.password : MASK}
            </p>
            {credentials && (
              <button
                type="button"
                onClick={copy}
                aria-label="Copy password"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={toggle}
              disabled={loading}
              aria-label={credentials ? "Hide password" : "Show password"}
              aria-pressed={credentials !== null}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : credentials ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        What the customer&apos;s router dials. Showing the password asks for your own password first and is recorded
        in the audit log; it hides again after 30 seconds.
      </p>
    </div>
  );
}
