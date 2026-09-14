"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface Props {
 identity: string;
}

export function Step4Done({ identity }: Props) {
 return (
 <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-2xl space-y-6">
 <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
 <CheckCircle2 className="h-8 w-8" />
 </div>

 <div>
 <h2 className="text-2xl font-sans font-normal text-foreground">Router Linked Successfully!</h2>
 <p className="mt-2 text-sm text-muted-foreground">
 <strong className="text-foreground font-sans tabular-nums">{identity}</strong> is now online, connected via WireGuard VPN, and managed by the IBS Control Plane.
 </p>
 </div>

 <div className="pt-4 flex justify-center gap-4">
 <Link
 href="/network/routers"
 className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-2.5 text-xs font-semibold text-black hover:bg-amber-400 transition"
 >
 View NAS Routers <ArrowRight className="h-4 w-4" />
 </Link>
 </div>
 </div>
 );
}