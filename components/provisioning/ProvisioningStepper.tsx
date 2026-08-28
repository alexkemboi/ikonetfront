"use client";

import React from "react";
import { Check } from "lucide-react";

interface Props {
 currentStep: number;
}

const STEPS = [
 { step: 1, label: "Identity" },
 { step: 2, label: "Provision" },
 { step: 3, label: "Services" },
 { step: 4, label: "Done" },
];

export function ProvisioningStepper({ currentStep }: Props) {
 return (
 <div className="flex items-center gap-6 text-xs font-mono uppercase tracking-wider">
 {STEPS.map((s) => {
 const isPassed = s.step < currentStep;
 const isCurrent = s.step === currentStep;

 return (
 <div key={s.step} className="flex items-center gap-2">
 <div
 className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition ${
 isPassed
 ? "bg-amber-500 text-black"
 : isCurrent
 ? "bg-amber-500/20 text-amber-400 border border-amber-500"
 : "bg-secondary text-muted-foreground"
 }`}
 >
 {isPassed ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : s.step}
 </div>
 <span className={isCurrent || isPassed ? "font-semibold text-foreground" : "text-muted-foreground"}>
 {s.label}
 </span>
 </div>
 );
 })}
 </div>
 );
}