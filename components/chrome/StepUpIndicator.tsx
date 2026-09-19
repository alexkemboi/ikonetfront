"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useStepUp } from "@/providers/StepUpProvider";

/** Compact countdown badge while a step-up elevation is active (memory-only). */
export default function StepUpIndicator() {
  const { isElevated, expiresAt } = useStepUp();
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!isElevated || !expiresAt) {
      return;
    }
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
    }, 1000);
    return () => clearInterval(id);
  }, [isElevated, expiresAt]);

  if (!isElevated || secondsLeft <= 0) {
    return null;
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <span
      title="Elevated privileges active"
      className="inline-flex h-8 items-center gap-1 rounded-full bg-emerald-500/10 px-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
    >
      <ShieldCheck className="h-3 w-3" />
      {minutes}:{String(seconds).padStart(2, "0")}
    </span>
  );
}