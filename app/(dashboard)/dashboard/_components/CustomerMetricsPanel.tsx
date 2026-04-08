"use client";

import { motion } from "framer-motion";
import { Users, UserCheck, UserX, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CustomerMetricsPanelProps {
  total: number;
  active: number;
  inactive: number;
  pppoe: number;
  delay?: number;
}

interface BreakdownRowProps {
  label: string;
  value: number;
  total: number;
  color: string;
  icon: React.ReactNode;
  index: number;
}

function BreakdownRow({ label, value, total, color, icon, index }: BreakdownRowProps) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.1 * index, ease: "easeOut" }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{value.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">({percentage}%)</span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.7, delay: 0.2 + 0.1 * index, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

export function CustomerMetricsPanel({
  total,
  active,
  inactive,
  pppoe,
  delay = 0,
}: CustomerMetricsPanelProps) {
  const rows: Omit<BreakdownRowProps, "index">[] = [
    {
      label: "Active Accounts",
      value: active,
      total,
      color: "bg-[var(--success)]",
      icon: <UserCheck className="h-4 w-4 text-[var(--success)]" />,
    },
    {
      label: "Inactive Accounts",
      value: inactive,
      total,
      color: "bg-destructive",
      icon: <UserX className="h-4 w-4 text-destructive" />,
    },
    {
      label: "PPPoE Customers",
      value: pppoe,
      total,
      color: "bg-primary",
      icon: <Wifi className="h-4 w-4 text-primary" />,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Customer Breakdown</CardTitle>
              <p className="text-xs text-muted-foreground">
                {total.toLocaleString()} total customers
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.map((row, i) => (
            <BreakdownRow key={row.label} {...row} index={i} />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
