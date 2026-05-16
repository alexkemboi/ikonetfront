"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value?: number;
  subtitle?: string;
  icon: LucideIcon;
  colorScheme?:
    | "navy"
    | "green"
    | "purple"
    | "orange"
    | "red"
    | "cyan";
  delay?: number;
}

const colorVariants = {
  navy: {
    card: "bg-[#EAF2FF]",
    icon: "bg-[#D7E7FF]",
    iconColor: "text-[#1D4ED8]",
    title: "text-[#0F172A]",
    subtitle: "text-[#64748B]",
  },

  green: {
    card: "bg-[#ECFDF3]",
    icon: "bg-[#D1FAE5]",
    iconColor: "text-[#059669]",
    title: "text-[#0F172A]",
    subtitle: "text-[#64748B]",
  },

  purple: {
    card: "bg-[#F5F0FF]",
    icon: "bg-[#E9D8FD]",
    iconColor: "text-[#7C3AED]",
    title: "text-[#0F172A]",
    subtitle: "text-[#64748B]",
  },

  orange: {
    card: "bg-[#FFF4E6]",
    icon: "bg-[#FFE4C7]",
    iconColor: "text-[#EA580C]",
    title: "text-[#0F172A]",
    subtitle: "text-[#64748B]",
  },

  red: {
    card: "bg-[#FEF2F2]",
    icon: "bg-[#FEE2E2]",
    iconColor: "text-[#DC2626]",
    title: "text-[#0F172A]",
    subtitle: "text-[#64748B]",
  },

  cyan: {
    card: "bg-[#ECFEFF]",
    icon: "bg-[#CFFAFE]",
    iconColor: "text-[#0891B2]",
    title: "text-[#0F172A]",
    subtitle: "text-[#64748B]",
  },
};

const safeNumber = (
  value?: number
): number => {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
};

const formatValue = (
  title: string,
  value?: number
) => {
  const safe = safeNumber(value);

  if (
    title.toLowerCase().includes("revenue") ||
    title.toLowerCase().includes("balance") ||
    title === "ARPU"
  ) {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(safe);
  }

  if (
    title.toLowerCase().includes("uptime")
  ) {
    return `${safe}%`;
  }

  if (
    title.toLowerCase().includes("bandwidth")
  ) {
    return `${safe}M`;
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(safe);
};

export function MetricCard({
  title,
  value = 0,
  subtitle = "",
  icon: Icon,
  colorScheme = "navy",
  delay = 0,
}: MetricCardProps) {
  const colors =
    colorVariants[colorScheme];

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      whileHover={{
        y: -1,
      }}
      transition={{
        duration: 0.2,
        delay,
      }}
      className={`
        relative overflow-hidden rounded-lg
        ${colors.card}
        border border-black/[0.04]
        px-3 py-2.5
        shadow-[0_1px_2px_rgba(0,0,0,0.04)]
        transition-all duration-200
        hover:shadow-[0_4px_10px_rgba(0,0,0,0.06)]
      `}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Content */}
        <div className="min-w-0 flex-1">
          <p
            className={`
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.08em]
              leading-none
              ${colors.subtitle}
            `}
          >
            {title}
          </p>

          <h3
            className={`
              mt-1.5
              text-lg lg:text-xl
              font-bold
              tracking-tight
              leading-none
              ${colors.title}
            `}
          >
            {formatValue(title, value)}
          </h3>

          {!!subtitle && (
            <p
              className={`
                mt-1
                truncate
                text-[10px]
                leading-tight
                ${colors.subtitle}
              `}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Icon */}
        <div
          className={`
            flex h-8 w-8 shrink-0
            items-center justify-center
            rounded-lg
            ${colors.icon}
          `}
        >
          <Icon
            className={`h-4 w-4 ${colors.iconColor}`}
          />
        </div>
      </div>
    </motion.div>
  );
}