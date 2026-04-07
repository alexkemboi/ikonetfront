"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Customer } from "@/lib/types/customer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCustomerDate,
  resolveExpiryStatusVariant,
} from "@/lib/utils/customerFormatters";

interface CustomerLifecycleBannerProps {
  customer: Customer;
}

type StepVariant = "complete" | "warning" | "danger" | "pending";

interface LifecycleStep {
  stepLabel: string;
  detail: string;
  isCompleted: boolean;
  variant: StepVariant;
}

function buildPPPoELifecycleSteps(customer: Customer): LifecycleStep[] {
  const expiryVariant = resolveExpiryStatusVariant(customer.expiryDate);
  return [
    {
      stepLabel: "Account Created",
      detail: formatCustomerDate(customer.createdAt),
      isCompleted: true,
      variant: "complete",
    },
    {
      stepLabel: "Subscription Active",
      detail: customer.packageName ?? "No package",
      isCompleted: customer.isSubActive === true,
      variant: customer.isSubActive ? "complete" : "pending",
    },
    {
      stepLabel: "Last Active",
      detail: customer.lastActiveDate
        ? formatCustomerDate(customer.lastActiveDate)
        : "Never",
      isCompleted: customer.lastActiveDate !== null,
      variant: customer.lastActiveDate ? "complete" : "pending",
    },
    {
      stepLabel: "Subscription Expiry",
      detail: formatCustomerDate(customer.expiryDate),
      isCompleted: customer.expiryDate !== null,
      variant: expiryVariant,
    },
  ];
}

const variantStyles: Record<StepVariant, { circle: string; text: string; connector: string }> = {
  complete: {
    circle: "bg-[var(--success)] border-[var(--success)] text-white",
    text: "text-[var(--success)]",
    connector: "bg-[var(--success)]",
  },
  warning: {
    circle: "bg-[var(--warning)] border-[var(--warning)] text-white",
    text: "text-[var(--warning)]",
    connector: "bg-[var(--warning)]",
  },
  danger: {
    circle: "bg-[var(--danger)] border-[var(--danger)] text-white",
    text: "text-[var(--danger)]",
    connector: "bg-[var(--danger)]",
  },
  pending: {
    circle: "bg-muted border-border text-muted-foreground",
    text: "text-muted-foreground",
    connector: "bg-border",
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const stepVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export function CustomerLifecycleBanner({
  customer,
}: CustomerLifecycleBannerProps) {
  const steps = buildPPPoELifecycleSteps(customer);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
          Customer Lifecycle
        </CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          className="flex flex-col md:flex-row items-start md:items-center gap-0"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {steps.map((step, index) => {
            const styles = variantStyles[step.variant];
            const isLast = index === steps.length - 1;

            return (
              <motion.div
                key={step.stepLabel}
                variants={stepVariants}
                className="flex flex-row md:flex-col items-start md:items-center flex-1 min-w-0"
              >
                {/* Circle + connector row */}
                <div className="flex flex-col md:flex-row items-center w-full">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${styles.circle}`}
                  >
                    {step.isCompleted ? (
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={`hidden md:block h-0.5 flex-1 ${styles.connector} mx-1`}
                    />
                  )}
                  {!isLast && (
                    <div
                      className={`block md:hidden w-0.5 h-6 ${styles.connector} ml-4 my-1`}
                    />
                  )}
                </div>

                {/* Label + detail */}
                <div className="mt-2 md:mt-3 ml-4 md:ml-0 md:text-center min-w-0 pb-4 md:pb-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {step.stepLabel}
                  </p>
                  <p className={`text-xs mt-0.5 truncate ${styles.text}`}>
                    {step.detail}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </CardContent>
    </Card>
  );
}
