"use client";

import React, { useState, useEffect } from "react";
import { Copy, Check, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { ProvisioningScriptResponse } from "@/lib/types/provisioning";
import { getRouterConnectionStatus } from "@/actions/provisioning";

interface Props {
 scriptData: ProvisioningScriptResponse;
 onConnected: () => void;
}

const MAX_POLLS = 40;
const POLL_INTERVAL_MS = 3000;

export function Step2Script({ scriptData, onConnected }: Props) {
 const [copied, setCopied] = useState(false);
 const [isChecking, setIsChecking] = useState(true);
 const [pollCount, setPollCount] = useState(0);
 const [stopped, setStopped] = useState(false);
 const [restartToken, setRestartToken] = useState(0);

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
 const status = await getRouterConnectionStatus(scriptData.routerId);
 if (!mounted) return;
 if (status.apiAuthenticated || status.isOnline) {
 setPollCount(count);
 setIsChecking(false);
 onConnected();
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
 }, [scriptData.routerId, onConnected, restartToken]);

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

 <div className="relative mt-4 rounded-xl border border-border bg-[#101010] p-4 font-sans tabular-nums text-xs text-zinc-200 break-all">
 <code className="font-mono-tech">{scriptData.fetchCommand}</code>
 <button
 onClick={handleCopy}
 className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-zinc-700 transition"
 >
 {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
 {copied ? "Copied!" : "Copy script"}
 </button>
 </div>

 {/* Live Status Listener */}
 <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
 <div className="flex items-center gap-2 text-xs font-sans tabular-nums text-amber-400">
 {isChecking ? (
 <>
 <Clock className="h-4 w-4 animate-spin" />
 <span>Checking connection... (attempt {pollCount})</span>
 </>
 ) : (
 <span className="text-emerald-400">Router connected successfully!</span>
 )}
 </div>

 {isChecking && (
 <button
 onClick={onConnected}
 className="text-xs font-sans tabular-nums text-muted-foreground underline hover:text-accent-foreground"
 >
 Skip to Services →
 </button>
 )}
 </div>

 {stopped && (
 <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
 <p className="text-xs text-red-300">
 Router not detected after{" "}
 {Math.round((MAX_POLLS * POLL_INTERVAL_MS) / 1000)} seconds.
 Make sure the provisioning script ran in RouterOS, then retry.
 </p>
 <button
 onClick={() => {
 setIsChecking(true);
 setStopped(false);
 setRestartToken((t) => t + 1);
 }}
 className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-zinc-700"
 >
 <RefreshCw className="h-3.5 w-3.5" /> Retry check
 </button>
 </div>
 )}
 </div>
 </div>
 );
}