"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  RefreshCw,
  Router,
  Package,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickAction {
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  iconColor: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Add Customer",
    description: "Register a new PPPoE customer",
    icon: UserPlus,
    href: "/customers/new",
    color: "bg-blue-50 hover:bg-blue-100",
    iconColor: "text-primary",
  },
  {
    label: "Renew Subscriptions",
    description: "View customers due for renewal",
    icon: RefreshCw,
    href: "/customers/pppoe",
    color: "bg-green-50 hover:bg-green-100",
    iconColor: "text-success",
  },
  {
    label: "Network Devices",
    description: "Monitor MikroTik infrastructure",
    icon: Router,
    href: "/network/microtick",
    color: "bg-purple-50 hover:bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    label: "Manage Packages",
    description: "Configure internet plans",
    icon: Package,
    href: "/system/internet-packages",
    color: "bg-orange-50 hover:bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    label: "Access Control",
    description: "Manage roles and permissions",
    icon: ShieldCheck,
    href: "/system/access",
    color: "bg-red-50 hover:bg-red-100",
    iconColor: "text-destructive",
  },
  {
    label: "Alert Providers",
    description: "Configure SMS and email alerts",
    icon: Bell,
    href: "/settings/alerts",
    color: "bg-yellow-50 hover:bg-yellow-100",
    iconColor: "text-[var(--warning)]",
  },
];

interface QuickActionsPanelProps {
  delay?: number;
}

export function QuickActionsPanel({ delay = 0 }: QuickActionsPanelProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {QUICK_ACTIONS.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: delay + 0.06 * i }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push(action.href)}
                  className={`flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-colors cursor-pointer ${action.color}`}
                >
                  <Icon className={`h-6 w-6 ${action.iconColor}`} />
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {action.label}
                    </p>
                    <p className="text-xs text-muted-foreground hidden sm:block mt-0.5">
                      {action.description}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
