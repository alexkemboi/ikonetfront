"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: LucideIcon;
  colorScheme: "navy" | "green" | "orange" | "red" | "purple";
  delay?: number;
  href?: string;
}

const colorMap: Record<
  MetricCardProps["colorScheme"],
  { bg: string; iconBg: string; iconColor: string; ring: string }
> = {
  navy: {
    bg: "from-[#103766] to-[#1a4f8a]",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    ring: "ring-[#103766]/20",
  },
  green: {
    bg: "from-[#2E865F] to-[#38a374]",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    ring: "ring-[#2E865F]/20",
  },
  orange: {
    bg: "from-[#FF9800] to-[#ffac33]",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    ring: "ring-[#FF9800]/20",
  },
  red: {
    bg: "from-[#e53935] to-[#ef5350]",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    ring: "ring-red-500/20",
  },
  purple: {
    bg: "from-[#6d28d9] to-[#7c3aed]",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    ring: "ring-purple-500/20",
  },
};

/** Animates a number from 0 to `target` over ~800ms */
function useCountUp(target: number, duration = 800) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    function tick(now: number) {
      const elapsed = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3); // easeOutCubic
      setDisplay(Math.round(eased * target));
      if (elapsed < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return display;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme,
  delay = 0,
}: MetricCardProps) {
  const colors = colorMap[colorScheme];
  const displayValue = useCountUp(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white ring-4",
        colors.bg,
        colors.ring
      )}
    >
      {/* Decorative background circle */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-8 -right-4 h-20 w-20 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="mt-1 text-4xl font-bold tracking-tight">
            {displayValue.toLocaleString()}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-white/70">{subtitle}</p>
          )}
        </div>
        <div className={cn("rounded-xl p-3", colors.iconBg)}>
          <Icon className={cn("h-6 w-6", colors.iconColor)} />
        </div>
      </div>
    </motion.div>
  );
}
