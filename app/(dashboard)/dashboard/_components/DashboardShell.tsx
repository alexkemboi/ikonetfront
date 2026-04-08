"use client";

import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  Wifi,
  Router,
  Package,
  Activity,
} from "lucide-react";

import { MikrotikDevice } from "@/lib/types/mikrotik";
import { InternetPackage } from "@/actions/packages";
import { MetricCard } from "./MetricCard";
import { CustomerMetricsPanel } from "./CustomerMetricsPanel";
import { NetworkStatusPanel } from "./NetworkStatusPanel";
import { PackageMetricsPanel } from "./PackageMetricsPanel";
import { QuickActionsPanel } from "./QuickActionsPanel";

interface DashboardMetrics {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  pppoeCustomers: number;
  totalPackages: number;
  activePackages: number;
  inactivePackages: number;
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
}

interface DashboardShellProps {
  metrics: DashboardMetrics;
  devices: MikrotikDevice[];
  packages: InternetPackage[];
}

export function DashboardShell({
  metrics,
  devices,
  packages,
}: DashboardShellProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
      </motion.div>

      {/* Row 1 — Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Customers"
          value={metrics.totalCustomers}
          subtitle={`${metrics.activeCustomers} active`}
          icon={Users}
          colorScheme="navy"
          delay={0.05}
        />
        <MetricCard
          title="Active Customers"
          value={metrics.activeCustomers}
          subtitle={`${metrics.pppoeCustomers} PPPoE`}
          icon={UserCheck}
          colorScheme="green"
          delay={0.1}
        />
        <MetricCard
          title="Network Devices"
          value={metrics.totalDevices}
          subtitle={`${metrics.onlineDevices} online · ${metrics.offlineDevices} offline`}
          icon={Router}
          colorScheme="purple"
          delay={0.15}
        />
        <MetricCard
          title="Internet Packages"
          value={metrics.totalPackages}
          subtitle={`${metrics.activePackages} active`}
          icon={Wifi}
          colorScheme="orange"
          delay={0.2}
        />
      </div>

      {/* Row 2 — Detail panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CustomerMetricsPanel
          total={metrics.totalCustomers}
          active={metrics.activeCustomers}
          inactive={metrics.inactiveCustomers}
          pppoe={metrics.pppoeCustomers}
          delay={0.25}
        />
        <NetworkStatusPanel
          devices={devices}
          online={metrics.onlineDevices}
          offline={metrics.offlineDevices}
          delay={0.3}
        />
        <PackageMetricsPanel
          packages={packages}
          active={metrics.activePackages}
          inactive={metrics.inactivePackages}
          delay={0.35}
        />
      </div>

      {/* Row 3 — Quick actions */}
      <QuickActionsPanel delay={0.4} />

      {/* Row 4 — System status footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="flex flex-wrap items-center gap-4 rounded-xl border bg-card px-5 py-3"
      >
        <div className="flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            System Status
          </span>
        </div>
        <StatusPill
          label="Customers"
          ok={metrics.activeCustomers > 0}
          count={metrics.activeCustomers}
        />
        <StatusPill
          label="Network"
          ok={metrics.offlineDevices === 0}
          count={metrics.onlineDevices}
          total={metrics.totalDevices}
        />
        <StatusPill
          label="Packages"
          ok={metrics.activePackages > 0}
          count={metrics.activePackages}
        />
        <div className="ml-auto">
          <Package className="h-4 w-4 text-muted-foreground" />
        </div>
      </motion.div>
    </div>
  );
}

function StatusPill({
  label,
  ok,
  count,
  total,
}: {
  label: string;
  ok: boolean;
  count: number;
  total?: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`h-2 w-2 rounded-full ${ok ? "bg-[var(--success)]" : "bg-[var(--warning)]"}`}
      />
      <span className="text-xs text-muted-foreground">
        {label}:{" "}
        <span className="font-semibold text-foreground">
          {count}
          {total !== undefined ? `/${total}` : ""}
        </span>
      </span>
    </div>
  );
}
