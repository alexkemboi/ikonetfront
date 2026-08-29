"use client";

import { motion } from "framer-motion";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Package,
  Router,
  TrendingUp,
  Users,
  Wifi,
  Wallet,
  ShieldAlert,
  Server,
  Signal,
} from "lucide-react";

import { MikrotikDevice } from "@/lib/types/mikrotik";
import { InternetPackage } from "@/actions/packages";

import { MetricCard } from "./MetricCard";
import { CustomerMetricsPanel } from "./CustomerMetricsPanel";
import { NetworkStatusPanel } from "./NetworkStatusPanel";
import { PackageMetricsPanel } from "./PackageMetricsPanel";
import { QuickActionsPanel } from "./QuickActionsPanel";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
  healthyRouters: number;

  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  activeRevenue: number;
  inactiveRevenue: number;

  expectedRevenue: number;
  collectedRevenue: number;
  outstandingBalances: number;
  failedPayments: number;

  revenueGrowth: number;
  arpu: number;

  hotspotRevenue: number;
  pppoeRevenue: number;
  suspendedRevenueLoss: number;

  offlineRouters: number;
  highCpuRouters: number;
  highMemoryRouters: number;
  expiringCustomers: number;
  expiredAccounts: number;
  failedPPPoESessions: number;
  failedHotspotSessions: number;
  networkCongestionAlerts: number;
  slaBreaches: number;
  failedPaymentCallbacks: number;
  smsFailures: number;
  fraudAlerts: number;
  bandwidthAlerts: number;

  activePPPoESessions: number;
  activeHotspotSessions: number;

  currentBandwidthUsage: number;
  peakHourUsage: number;

  uptimePercentage: number;
  customerGrowth: number;
  churnRate: number;
  supportTickets: number;
}

interface DashboardShellProps {
  metrics: DashboardMetrics;
  devices: MikrotikDevice[];
  packages: InternetPackage[];
}

const safeNumber = (value?: unknown): number => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

const formatKES = (value?: number) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(safeNumber(value));
};

const formatNumber = (value?: number) => {
  return new Intl.NumberFormat("en-US").format(
    safeNumber(value)
  );
};
const revenueTrendData = [
  { month: "Jan", revenue: 240000, collected: 210000 },
  { month: "Feb", revenue: 280000, collected: 250000 },
  { month: "Mar", revenue: 320000, collected: 295000 },
  { month: "Apr", revenue: 390000, collected: 340000 },
  { month: "May", revenue: 460000, collected: 410000 },
  { month: "Jun", revenue: 520000, collected: 470000 },
];

const subscriberGrowthData = [
  { month: "Jan", users: 420 },
  { month: "Feb", users: 510 },
  { month: "Mar", users: 680 },
  { month: "Apr", users: 790 },
  { month: "May", users: 920 },
  { month: "Jun", users: 1180 },
];
export function DashboardShell({
  metrics,
  devices = [],
  packages = [],
}: DashboardShellProps) {
  const today = new Date().toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <div className="space-y-6 overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.35,
          ease: "easeOut",
        }}
      >
        <h1 className="text-2xl font-bold tracking-tight">
          Dashboard
        </h1>

        <p className="text-sm text-muted-foreground mt-0.5">
          {today}
        </p>
      </motion.div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Customers"
          value={safeNumber(metrics.totalCustomers)}
          subtitle={`${formatNumber(
            metrics.activeCustomers
          )} active subscribers`}
          icon={Users}
          colorScheme="navy"
          delay={0.05}
        />

        <MetricCard
          title="Monthly Revenue"
          value={safeNumber(metrics.monthlyRevenue)}
          subtitle={`${metrics.revenueGrowth}% growth`}
          icon={Wallet}
          colorScheme="green"
          delay={0.1}
        />

        <MetricCard
          title="Network Devices"
          value={safeNumber(metrics.totalDevices)}
          subtitle={`${formatNumber(
            metrics.onlineDevices
          )} online · ${formatNumber(
            metrics.offlineDevices
          )} offline`}
          icon={Router}
          colorScheme="purple"
          delay={0.15}
        />

        <MetricCard
          title="Internet Packages"
          value={safeNumber(metrics.totalPackages)}
          subtitle={`${formatNumber(
            metrics.activePackages
          )} active plans`}
          icon={Wifi}
          colorScheme="orange"
          delay={0.2}
        />
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Daily Revenue"
          value={safeNumber(metrics.dailyRevenue)}
          subtitle={formatKES(
            metrics.dailyRevenue
          )}
          icon={TrendingUp}
          colorScheme="green"
          delay={0.25}
        />

        <MetricCard
          title="Expected Revenue"
          value={safeNumber(
            metrics.expectedRevenue
          )}
          subtitle={formatKES(
            metrics.expectedRevenue
          )}
          icon={ArrowUpRight}
          colorScheme="navy"
          delay={0.3}
        />

        <MetricCard
          title="Outstanding Balances"
          value={safeNumber(
            metrics.outstandingBalances
          )}
          subtitle={formatKES(
            metrics.outstandingBalances
          )}
          icon={AlertTriangle}
          colorScheme="orange"
          delay={0.35}
        />

        <MetricCard
          title="ARPU"
          value={safeNumber(metrics.arpu)}
          subtitle={formatKES(metrics.arpu)}
          icon={Users}
          colorScheme="purple"
          delay={0.4}
        />
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="PPPoE Sessions"
          value={safeNumber(
            metrics.activePPPoESessions
          )}
          subtitle="Currently authenticated"
          icon={Signal}
          colorScheme="navy"
          delay={0.45}
        />

        <MetricCard
          title="Hotspot Sessions"
          value={safeNumber(
            metrics.activeHotspotSessions
          )}
          subtitle="Connected hotspot users"
          icon={Wifi}
          colorScheme="orange"
          delay={0.5}
        />

        <MetricCard
          title="Internet Uptime"
          value={safeNumber(
            metrics.uptimePercentage
          )}
          subtitle={`${metrics.uptimePercentage}% availability`}
          icon={Activity}
          colorScheme="green"
          delay={0.55}
        />

        <MetricCard
          title="Bandwidth Usage"
          value={safeNumber(
            metrics.currentBandwidthUsage
          )}
          subtitle={`Peak ${formatNumber(
            metrics.peakHourUsage
          )} Mbps`}
          icon={Server}
          colorScheme="purple"
          delay={0.6}
        />
      </div>

      {/* Existing Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CustomerMetricsPanel
          total={safeNumber(
            metrics.totalCustomers
          )}
          active={safeNumber(
            metrics.activeCustomers
          )}
          inactive={safeNumber(
            metrics.inactiveCustomers
          )}
          pppoe={safeNumber(
            metrics.pppoeCustomers
          )}
          delay={0.65}
        />

        <NetworkStatusPanel
          devices={devices ?? []}
          online={safeNumber(
            metrics.onlineDevices
          )}
          offline={safeNumber(
            metrics.offlineDevices
          )}
          delay={0.7}
        />

        <PackageMetricsPanel
          packages={packages ?? []}
          active={safeNumber(
            metrics.activePackages
          )}
          inactive={safeNumber(
            metrics.inactivePackages
          )}
          delay={0.75}
        />
      </div>

      {/* Critical Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.35,
          delay: 0.8,
        }}
        className="rounded-xl border bg-card p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="h-4 w-4 text-warning" />

          <h2 className="text-sm font-semibold">
            Critical Alerts
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <AlertBadge
            label="Offline Routers"
            value={metrics.offlineRouters}
            critical={metrics.offlineRouters > 0}
          />

          <AlertBadge
            label="High CPU"
            value={metrics.highCpuRouters}
            critical={metrics.highCpuRouters > 0}
          />

          <AlertBadge
            label="PPP Failures"
            value={metrics.failedPPPoESessions}
            critical={
              metrics.failedPPPoESessions > 0
            }
          />

          <AlertBadge
            label="Congestion"
            value={
              metrics.networkCongestionAlerts
            }
            critical={
              metrics.networkCongestionAlerts > 0
            }
          />

          <AlertBadge
            label="Payment Failures"
            value={metrics.failedPayments}
            critical={metrics.failedPayments > 0}
          />

          <AlertBadge
            label="SLA Breaches"
            value={metrics.slaBreaches}
            critical={metrics.slaBreaches > 0}
          />
        </div>
      </motion.div>


{/* Revenue & Growth Charts */}
<div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
  {/* Revenue Trend */}
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration: 0.35,
      delay: 0.83,
    }}
    className="rounded-xl border bg-card p-4"
  >
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h3 className="text-sm font-semibold">
          Revenue Trends
        </h3>

        <p className="text-xs text-muted-foreground">
          Monthly revenue collections
        </p>
      </div>

      <TrendingUp className="h-4 w-4 text-muted-foreground" />
    </div>

    <div className="h-60">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <AreaChart
          data={revenueTrendData}
        >
          <defs>
            <linearGradient
              id="revenueGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor="#10B981"
                stopOpacity={0.35}
              />

              <stop
                offset="95%"
                stopColor="#10B981"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#E2E8F0"
          />

          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />

          <YAxis
            tickFormatter={(value: number) =>
              `${value / 1000}K`
            }
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />

          <Tooltip
            formatter={(value) =>
              formatKES(typeof value === "number" ? value : Number(value ?? 0))
            }
          />

          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />

          <Area
            type="monotone"
            dataKey="collected"
            stroke="#2563EB"
            strokeWidth={2}
            fillOpacity={0}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </motion.div>

  {/* Subscriber Growth */}
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration: 0.35,
      delay: 0.84,
    }}
    className="rounded-xl border bg-card p-4"
  >
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h3 className="text-sm font-semibold">
          Subscriber Growth
        </h3>

        <p className="text-xs text-muted-foreground">
          Active customer expansion
        </p>
      </div>

      <Users className="h-4 w-4 text-muted-foreground" />
    </div>

    <div className="h-60">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <LineChart
          data={subscriberGrowthData}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#E2E8F0"
          />

          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="users"
            stroke="#7C3AED"
            strokeWidth={3}
            dot={{
              r: 4,
            }}
            activeDot={{
              r: 6,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </motion.div>
</div>



      {/* Revenue Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.35,
          delay: 0.85,
        }}
        className="rounded-xl border bg-card p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="h-4 w-4 text-muted-foreground" />

          <h2 className="text-sm font-semibold">
            Revenue Analytics
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <AnalyticsItem
            label="Collected Revenue"
            value={formatKES(
              metrics.collectedRevenue
            )}
          />

          <AnalyticsItem
            label="Hotspot Revenue"
            value={formatKES(
              metrics.hotspotRevenue
            )}
          />

          <AnalyticsItem
            label="PPPoE Revenue"
            value={formatKES(
              metrics.pppoeRevenue
            )}
          />

          <AnalyticsItem
            label="Suspended Revenue Loss"
            value={formatKES(
              metrics.suspendedRevenueLoss
            )}
          />
        </div>
      </motion.div>

      {/* Quick Actions */}
      <QuickActionsPanel delay={0.9} />

      {/* System Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.4,
          delay: 1,
        }}
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
          label="Routers"
          ok={metrics.offlineDevices === 0}
          count={metrics.onlineDevices}
          total={metrics.totalDevices}
        />

        <StatusPill
          label="Packages"
          ok={metrics.activePackages > 0}
          count={metrics.activePackages}
        />

        <StatusPill
          label="Support"
          ok={metrics.supportTickets < 20}
          count={metrics.supportTickets}
        />

        <div className="ml-auto">
          <Package className="h-4 w-4 text-muted-foreground" />
        </div>
      </motion.div>
    </div>
  );
}

function AlertBadge({
  label,
  value,
  critical,
}: {
  label: string;
  value: number;
  critical?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
        critical
          ? "border-warning/30 bg-warning/10"
          : "border-border"
      }`}
    >
      <div className="font-medium truncate">
        {label}
      </div>

      <div className="mt-1 text-lg font-bold">
        {formatNumber(value)}
      </div>
    </div>
  );
}

function AnalyticsItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold">
        {value}
      </p>
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
        className={`h-2 w-2 rounded-full ${
          ok
            ? "bg-success"
            : "bg-warning"
        }`}
      />

      <span className="text-xs text-muted-foreground">
        {label}:{" "}
        <span className="font-semibold text-foreground">
          {formatNumber(count)}

          {typeof total === "number"
            ? `/${formatNumber(total)}`
            : ""}
        </span>
      </span>
    </div>
  );
}