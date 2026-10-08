"use client";

import React, { useState, useEffect } from "react";
import { Copy, Check, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import type { ProvisioningScriptResponse, ZtpSessionStatus } from "@/lib/types/provisioning";
import { getZtpProvisioningStatus } from "@/actions/provisioning";
import { Button } from "@/components/ui/button";

interface Props {
 scriptData: ProvisioningScriptResponse;
 onConnected: () => void;
 /** Back to step 1 to issue a fresh command (the old one expired or was revoked). */
 onRestart: () => void;
}

function formatExpiry(expiresAt: string | null): string | null {
 if (!expiresAt) return null;
 const date = new Date(expiresAt);
 return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
}

const MAX_POLLS = 200;
const POLL_INTERVAL_MS = 3000;

function describeProgress(status: ZtpSessionStatus | null): string {
 switch (status) {
 case "DELIVERED":
 return "Router fetched the script — applying configuration...";
 case "COMPLETED":
 return "Script finished — waiting for the router to come online over the tunnel...";
 default:
 return "Waiting for the router to fetch the script...";
 }
}

export function Step2Script({ scriptData, onConnected, onRestart }: Props) {
 const [copied, setCopied] = useState(false);
 const [isChecking, setIsChecking] = useState(true);
 const [pollCount, setPollCount] = useState(0);
 const [stopped, setStopped] = useState(false);
 const [restartToken, setRestartToken] = useState(0);
 const [sessionStatus, setSessionStatus] = useState<ZtpSessionStatus | null>(null);
 const commandDead = sessionStatus === "EXPIRED" || sessionStatus === "REVOKED";

 function handleCopy() {
 navigator.clipboard.writeText(scriptData.fetchCommand);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 }

 useEffect(() => {
 let mounted = true;
 let timer: ReturnType<typeof setTimeout>;
 let count = 0;

 async function poll() {
 if (!mounted) return;
 try {
 const result = await getZtpProvisioningStatus(scriptData.deviceId);
 if (!mounted) return;
 // A failed poll (null status) keeps the last known stage.
 if (result.status) setSessionStatus(result.status);
 if (result.status === "COMPLETED" && result.online) {
 setPollCount(count);
 setIsChecking(false);
 onConnected();
 return;
 }
 if (result.status === "EXPIRED" || result.status === "REVOKED") {
 setIsChecking(false);
 return;
 }
 } catch {
 if (!mounted) return;
 }
 count += 1;
 setPollCount(count);
 if (count >= MAX_POLLS) {
 setIsChecking(false);
 setStopped(true);
 return;
 }
 timer = setTimeout(poll, POLL_INTERVAL_MS);
 }

 void poll();
 return () => {
 mounted = false;
 clearTimeout(timer);
 };
 }, [scriptData.deviceId, onConnected, restartToken]);

 const expiry = formatExpiry(scriptData.expiresAt);

 return (
 <div className="space-y-6">
 {/* Device Mode Advisory Callout */}
 <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 shadow-lg">
 <div className="flex items-center gap-2 font-semibold text-sm text-amber-400">
 <AlertTriangle className="h-4 w-4" />
 <span>Device mode not allowed</span>
 </div>
 <p className="mt-2 text-xs text-muted-foreground">
 If the router returns this error after pasting the script, switch to advanced mode before retrying:
 </p>
 <ol className="mt-2.5 list-decimal pl-5 space-y-1 text-xs text-muted-foreground font-sans tabular-nums">
 <li>Open the MikroTik terminal (Winbox → New Terminal)</li>
 <li>Run <code className="text-amber-300">/system/device-mode update mode=advanced</code></li>
 <li>Unplug the power cord for 10 seconds, then restore power</li>
 <li>Re-run the provisioning command below</li>
 </ol>
 </div>

 {/* Terminal Command Codebox */}
 <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
 <div className="border-b border-border pb-3">
 <h2 className="text-base font-normal text-foreground">Provisioning script</h2>
 <p className="text-xs text-muted-foreground">
 Open Winbox → New Terminal and paste this one-liner. The router pulls its VPN config automatically.
 </p>
 </div>

 {(scriptData.allocatedVpnIp || expiry) && (
 <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-xs">
 {scriptData.allocatedVpnIp && (
 <div>
 <dt className="text-muted-foreground">Allocated VPN IP</dt>
 <dd className="font-sans tabular-nums text-foreground">{scriptData.allocatedVpnIp}</dd>
 </div>
 )}
 {expiry && (
 <div>
 <dt className="text-muted-foreground">Single-use link expires</dt>
 <dd className="font-sans tabular-nums text-foreground">{expiry}</dd>
 </div>
 )}
 </dl>
 )}

 <div className="relative mt-4 rounded-xl border border-border bg-[#101010] p-4 font-sans tabular-nums text-xs text-zinc-200 break-all">
 <code className="font-mono-tech">{scriptData.fetchCommand}</code>
 <Button
 onClick={handleCopy}
 variant="secondary"
 size="sm"
 className="absolute right-3 top-3"
 >
 {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
 {copied ? "Copied!" : "Copy script"}
 </Button>
 </div>

 {/* Live Status Listener */}
 <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
 <div className="flex items-center gap-2 text-xs font-sans tabular-nums text-amber-400">
 {isChecking ? (
 <>
 <Clock className="h-4 w-4 animate-spin" />
 <span>{describeProgress(sessionStatus)} (attempt {pollCount})</span>
 </>
 ) : commandDead ? (
 <span className="text-red-300">
 {sessionStatus === "EXPIRED" ? "This command has expired." : "This command was revoked."}
 </span>
 ) : stopped ? (
 <span className="text-muted-foreground">Not connected yet.</span>
 ) : (
 <span className="text-emerald-400">Router connected successfully!</span>
 )}
 </div>

 </div>

 {commandDead && (
 <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
 <p className="text-xs text-red-300">
 The router can no longer use this command. Generate a new one and paste it again.
 </p>
 <Button onClick={onRestart} variant="secondary" size="sm" className="mt-3">
 <RefreshCw className="h-3.5 w-3.5" /> Generate a new command
 </Button>
 </div>
 )}

 {stopped && (
 <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
 <p className="text-xs text-red-300">
 Router not ready after{" "}
 {Math.round((MAX_POLLS * POLL_INTERVAL_MS) / 60000)} minutes.
 Make sure the provisioning script ran in RouterOS, then retry. The router stays listed as offline
 under NAS Routers until it checks in.
 </p>
 <Button
 onClick={() => {
 setIsChecking(true);
 setStopped(false);
 setRestartToken((t) => t + 1);
 }}
 variant="secondary"
 size="sm"
 className="mt-3"
 >
 <RefreshCw className="h-3.5 w-3.5" /> Retry check
 </Button>
 </div>
 )}
 </div>
 </div>
 );
}