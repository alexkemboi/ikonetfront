"use client";

import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { finalizeZtpServices } from "@/actions/provisioning";

interface Props {
 routerId: string;
 onComplete: () => void;
}

export function Step3Services({ routerId, onComplete }: Props) {
 const [hotspot, setHotspot] = useState(true);
 const [pppoe, setPppoe] = useState(true);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [error, setError] = useState<string | null>(null);

 async function handleFinalize() {
 setError(null);
 setIsSubmitting(true);
 const res = await finalizeZtpServices({
 routerId,
 enableHotspot: hotspot,
 enablePppoe: pppoe,
 });
 setIsSubmitting(false);
 if (res.success) {
 onComplete();
 } else {
 setError(res.message || "Failed to finalize router setup.");
 }
 }

 return (
 <div className="rounded-2xl border border-border bg-card p-6 shadow-xl space-y-6">
 <div className="border-b border-border pb-3">
 <h2 className="text-base font-normal text-foreground">Select Services</h2>
 <p className="text-xs text-muted-foreground">Choose which access networks to enable on this router.</p>
 </div>

 <div className="space-y-4">
 <label className="flex items-center justify-between rounded-xl border border-border bg-muted p-4 cursor-pointer">
 <div>
 <div className="font-semibold text-foreground text-sm">Hotspot Captive Portal</div>
 <div className="text-xs text-muted-foreground">Enable prepaid voucher checkouts and guest portal</div>
 </div>
 <input
 type="checkbox"
 checked={hotspot}
 onChange={(e) => setHotspot(e.target.checked)}
 className="h-5 w-5 rounded border-border bg-secondary text-amber-500"
 />
 </label>

 <label className="flex items-center justify-between rounded-xl border border-border bg-muted p-4 cursor-pointer">
 <div>
 <div className="font-semibold text-foreground text-sm">PPPoE Server Engine</div>
 <div className="text-xs text-muted-foreground">Enable residential fixed-wireless and fiber accounts</div>
 </div>
 <input
 type="checkbox"
 checked={pppoe}
 onChange={(e) => setPppoe(e.target.checked)}
 className="h-5 w-5 rounded border-border bg-secondary text-amber-500"
 />
 </label>
 </div>

 {error && (
 <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
 <AlertCircle className="h-4 w-4 shrink-0" />
 <span>{error}</span>
 </div>
 )}

 <div className="flex justify-end border-t border-border pt-4">
 <button
 onClick={handleFinalize}
 disabled={isSubmitting}
 className="rounded-lg bg-amber-500 px-6 py-2.5 text-xs font-semibold text-black hover:bg-amber-400 transition disabled:opacity-50"
 >
 {isSubmitting ? "Activating..." : "Save & Finish Setup →"}
 </button>
 </div>
 </div>
 );
}