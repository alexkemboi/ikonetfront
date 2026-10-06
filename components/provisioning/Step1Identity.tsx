"use client";

import React, { useState } from "react";
import { AlertCircle, AlertTriangle } from "lucide-react";
import type { ZtpBootstrapInput } from "@/lib/types/provisioning";
import { validateZtpBootstrapInput } from "@/lib/utils/ztp-validation";

interface Props {
 /** Resolves to an error message, or null once the wizard has moved on. */
 onContinue: (input: ZtpBootstrapInput) => Promise<string | null>;
 onCancel: () => void;
}

const INPUT_CLASS =
 "mt-1 w-full rounded-lg border border-border bg-muted p-3 text-sm text-foreground focus:border-amber-500 focus:outline-none";

export function Step1Identity({ onContinue, onCancel }: Props) {
 const [identity, setIdentity] = useState("");
 const [hotspot, setHotspot] = useState(true);
 const [pppoe, setPppoe] = useState(true);
 const [acknowledged, setAcknowledged] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [error, setError] = useState<string | null>(null);

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault();
 if (isSubmitting) return;

 const input: ZtpBootstrapInput = {
 identity: identity.trim(),
 acknowledgeDestructiveReset: acknowledged,
 hotspotEnabled: hotspot,
 pppoeEnabled: pppoe,
 };
 const invalid = validateZtpBootstrapInput(input);
 if (invalid) {
 setError(invalid);
 return;
 }

 setError(null);
 setIsSubmitting(true);
 try {
 const failure = await onContinue(input);
 if (failure) setError(failure);
 } catch {
 setError("Could not reach the provisioning service. Please try again.");
 } finally {
 setIsSubmitting(false);
 }
 }

 return (
 <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-border bg-card p-6 shadow-xl space-y-6">
 <div className="border-b border-border pb-3">
 <h2 className="text-base font-normal text-foreground">Router identity</h2>
 <p className="text-xs text-muted-foreground">The identity shown in Winbox under System → Identity.</p>
 </div>

 <div>
 <label htmlFor="ztp-identity" className="text-xs font-sans tabular-nums text-muted-foreground">MikroTik identity *</label>
 <input
 id="ztp-identity"
 type="text"
 required
 value={identity}
 onChange={(e) => setIdentity(e.target.value)}
 placeholder="MikroTik1"
 maxLength={64}
 className={INPUT_CLASS}
 />
 <p className="mt-2 text-xs text-muted-foreground">
 Letters, numbers, and spaces — must start and end with a letter or number.
 </p>
 </div>

 <fieldset className="space-y-3">
 <legend className="text-xs font-sans tabular-nums text-muted-foreground">Services to configure on this router</legend>
 <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-muted p-4">
 <div>
 <div className="text-sm font-semibold text-foreground">Hotspot Captive Portal</div>
 <div className="text-xs text-muted-foreground">Enable prepaid voucher checkouts and guest portal</div>
 </div>
 <input
 type="checkbox"
 checked={hotspot}
 onChange={(e) => setHotspot(e.target.checked)}
 className="h-5 w-5 rounded border-border bg-secondary text-amber-500"
 />
 </label>
 <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-muted p-4">
 <div>
 <div className="text-sm font-semibold text-foreground">PPPoE Server Engine</div>
 <div className="text-xs text-muted-foreground">Enable residential fixed-wireless and fiber accounts</div>
 </div>
 <input
 type="checkbox"
 checked={pppoe}
 onChange={(e) => setPppoe(e.target.checked)}
 className="h-5 w-5 rounded border-border bg-secondary text-amber-500"
 />
 </label>
 </fieldset>

 <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
 <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
 <AlertTriangle className="h-4 w-4" />
 <span>The script replaces existing configuration</span>
 </div>
 <p className="mt-2 text-xs text-muted-foreground">
 This is not a factory reset, but on import the script removes and recreates:
 </p>
 <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
 <li>all NAT rules and all static firewall filter rules</li>
 <li>all RADIUS clients and the whole hotspot walled garden</li>
 <li>hotspot and PPPoE pools, profiles and servers</li>
 <li>the <code className="text-amber-300">wg-ibs</code> WireGuard interface and the <code className="text-amber-300">ibs-api</code> user</li>
 </ul>
 <p className="mt-2 text-xs text-muted-foreground">
 On a router already carrying traffic, export its configuration first.
 </p>
 <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-foreground">
 <input
 type="checkbox"
 aria-label="Acknowledge configuration replacement"
 checked={acknowledged}
 onChange={(e) => setAcknowledged(e.target.checked)}
 className="mt-0.5 h-4 w-4 rounded border-border bg-secondary text-amber-500"
 />
 <span>I understand this configuration will be replaced on this router.</span>
 </label>
 </div>

 {error && (
 <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
 <AlertCircle className="h-4 w-4 shrink-0" />
 <span>{error}</span>
 </div>
 )}

 <div className="flex justify-end gap-3 border-t border-border pt-4">
 <button
 type="button"
 onClick={onCancel}
 className="rounded-lg border border-border px-5 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-accent"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={isSubmitting}
 className="rounded-lg bg-amber-500 px-6 py-2.5 text-xs font-semibold text-black hover:bg-amber-400 transition disabled:opacity-50"
 >
 {isSubmitting ? "Generating script..." : "Continue →"}
 </button>
 </div>
 </form>
 );
}
