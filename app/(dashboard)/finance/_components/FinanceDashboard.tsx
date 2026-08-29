"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wifi,
  Zap,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getRevenueOverview, getRecentTransactions } from "@/actions/finance";

// ── Fallback data ────────────────────────────────────────────────────────────────

const FALLBACK_MONTHLY_REVENUE = [
  { month: "Dec", hotspot: 38400, pppoe: 124000, total: 162400 },
  { month: "Jan", hotspot: 42100, pppoe: 131500, total: 173600 },
  { month: "Feb", hotspot: 39800, pppoe: 128000, total: 167800 },
  { month: "Mar", hotspot: 51200, pppoe: 142000, total: 193200 },
  { month: "Apr", hotspot: 47600, pppoe: 138500, total: 186100 },
  { month: "May", hotspot: 55300, pppoe: 156000, total: 211300 },
];

const FALLBACK_TRANSACTIONS = [
  { id: "TXN-0042", customer: "John Mwangi", type: "pppoe", package: "Home 10 Mbps", amount: 2500, status: "completed", date: "2026-05-06", method: "M-Pesa" },
  { id: "TXN-0041", customer: "Mary Akinyi", type: "hotspot", package: "KES 50 – 1 Hour", amount: 50, status: "completed", date: "2026-05-06", method: "M-Pesa" },
  { id: "TXN-0040", customer: "Peter Otieno", type: "pppoe", package: "Business 20 Mbps", amount: 4500, status: "completed", date: "2026-05-05", method: "M-Pesa" },
  { id: "TXN-0039", customer: "Grace Wanjiku", type: "hotspot", package: "KES 100 – 3 Hours", amount: 100, status: "completed", date: "2026-05-05", method: "Airtel" },
  { id: "TXN-0038", customer: "Samuel Kamau", type: "pppoe", package: "Home 10 Mbps", amount: 2500, status: "pending", date: "2026-05-05", method: "M-Pesa" },
  { id: "TXN-0037", customer: "Alice Njeri", type: "hotspot", package: "KES 200 – Daily", amount: 200, status: "completed", date: "2026-05-04", method: "M-Pesa" },
  { id: "TXN-0036", customer: "David Kipchoge", type: "pppoe", package: "Home 5 Mbps", amount: 1500, status: "completed", date: "2026-05-04", method: "Cash" },
  { id: "TXN-0035", customer: "Esther Mutua", type: "hotspot", package: "KES 50 – 1 Hour", amount: 50, status: "failed", date: "2026-05-03", method: "Airtel" },
  { id: "TXN-0034", customer: "James Oloo", type: "pppoe", package: "Business 20 Mbps", amount: 4500, status: "completed", date: "2026-05-03", method: "M-Pesa" },
  { id: "TXN-0033", customer: "Faith Chebet", type: "hotspot", package: "KES 500 – Weekly", amount: 500, status: "completed", date: "2026-05-02", method: "M-Pesa" },
];

const PACKAGE_BREAKDOWN = [
  { name: "Home 10 Mbps", type: "pppoe", subscribers: 142, revenue: 355000, growth: 8.2 },
  { name: "Business 20 Mbps", type: "pppoe", subscribers: 58, revenue: 261000, growth: 12.5 },
  { name: "Home 5 Mbps", type: "pppoe", subscribers: 87, revenue: 130500, growth: -2.1 },
  { name: "KES 50 – 1 Hour", type: "hotspot", subscribers: 0, revenue: 74500, growth: 18.3 },
  { name: "KES 100 – 3 Hours", type: "hotspot", subscribers: 0, revenue: 48200, growth: 6.7 },
  { name: "KES 200 – Daily", type: "hotspot", subscribers: 0, revenue: 39600, growth: 22.1 },
  { name: "KES 500 – Weekly", type: "hotspot", subscribers: 0, revenue: 28400, growth: 15.4 },
];

// ── Mini bar chart ─────────────────────────────────────────────────────────────

function MiniBarChart({
  data,
  filter,
}: {
  data: typeof FALLBACK_MONTHLY_REVENUE;
  filter: "all" | "hotspot" | "pppoe";
}) {
  const values = data.map((d) =>
    filter === "hotspot" ? d.hotspot : filter === "pppoe" ? d.pppoe : d.total
  );
  const max = Math.max(...values);

  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((d, i) => {
        const val = filter === "hotspot" ? d.hotspot : filter === "pppoe" ? d.pppoe : d.total;
        const heightPct = max > 0 ? (val / max) * 100 : 0;
        const isLast = i === data.length - 1;

        return (
          <div key={d.month} className="flex flex-col items-center gap-1 flex-1">
            <div className="w-full flex flex-col justify-end" style={{ height: "80px" }}>
              <div
                title={`KES ${val.toLocaleString()}`}
                className={cn(
                  "w-full rounded-t-sm transition-all duration-500",
                  isLast
                    ? "bg-primary"
                    : filter === "hotspot"
                    ? "bg-warning/60"
                    : filter === "pppoe"
                    ? "bg-success/60"
                    : "bg-primary/40"
                )}
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground font-medium">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  delta,
  icon: Icon,
  color,
  delay = 0,
}: {
  title: string;
  value: string;
  subtitle: string;
  delta: number;
  icon: React.ElementType;
  color: string;
  delay?: number;
}) {
  const positive = delta >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card>
        <CardContent className="pt-5 pb-4 px-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
              <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            </div>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className={cn("flex items-center gap-1 mt-3 text-xs font-semibold", positive ? "text-success" : "text-destructive")}>
            {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(delta)}% vs last month
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") return <Badge className="bg-success/10 text-success border-success/20 text-[10px]" variant="outline">Paid</Badge>;
  if (status === "pending")   return <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px]" variant="outline">Pending</Badge>;
  return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]" variant="outline">Failed</Badge>;
}

// ── Main ───────────────────────────────────────────────────────────────────────

type MonthlyRevenuePoint = (typeof FALLBACK_MONTHLY_REVENUE)[number];
type RecentTransaction = (typeof FALLBACK_TRANSACTIONS)[number];

export default function FinanceDashboard() {
  const [revenueFilter, setRevenueFilter] = useState<"all" | "hotspot" | "pppoe">("all");
  const [txFilter, setTxFilter] = useState<"all" | "hotspot" | "pppoe">("all");
  const [revenueData, setRevenueData] = useState<{ monthlyRevenue: MonthlyRevenuePoint[] } | null>(null);
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [revResult, txResult] = await Promise.all([
          getRevenueOverview(),
          getRecentTransactions(10),
        ]);
        if (cancelled) return;
        if (revResult?.success) setRevenueData(revResult.data);
        if (txResult?.success) setTransactions(txResult.data || []);
      } catch {
        // fallback to hardcoded data
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const hasData = !!revenueData?.monthlyRevenue?.length;
  const monthlyRevenue = revenueData?.monthlyRevenue?.length
    ? revenueData.monthlyRevenue
    : FALLBACK_MONTHLY_REVENUE;
  const recentTransactions = transactions.length > 0 ? transactions : FALLBACK_TRANSACTIONS;

  const current = monthlyRevenue[monthlyRevenue.length - 1];
  const prev    = monthlyRevenue[monthlyRevenue.length - 2];

  const totalDelta   = Math.round(((current.total   - prev.total)   / prev.total)   * 100 * 10) / 10;
  const hotspotDelta = Math.round(((current.hotspot - prev.hotspot) / prev.hotspot) * 100 * 10) / 10;
  const pppoDelta    = Math.round(((current.pppoe   - prev.pppoe)   / prev.pppoe)   * 100 * 10) / 10;

  const filteredTx = txFilter === "all"
    ? recentTransactions
    : recentTransactions.filter((t) => t.type === txFilter);

  const filteredPkgs = revenueFilter === "all"
    ? PACKAGE_BREAKDOWN
    : PACKAGE_BREAKDOWN.filter((p) => p.type === revenueFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8 pt-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs mb-1" variant="outline">Finance</Badge>
          <h1 className="text-2xl font-bold tracking-tight">Revenue Overview</h1>
          <p className="text-sm text-muted-foreground">{hasData ? "Live data from backend" : "May 2026 · Dummy data for demonstration"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
            <Calendar className="w-3.5 h-3.5" /> May 2026
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`KES ${current.total.toLocaleString()}`}
          subtitle="All customer types"
          delta={totalDelta}
          icon={DollarSign}
          color="bg-primary"
          delay={0.05}
        />
        <StatCard
          title="PPPoE Revenue"
          value={`KES ${current.pppoe.toLocaleString()}`}
          subtitle="Monthly subscriptions"
          delta={pppoDelta}
          icon={Wifi}
          color="bg-success"
          delay={0.1}
        />
        <StatCard
          title="Hotspot Revenue"
          value={`KES ${current.hotspot.toLocaleString()}`}
          subtitle="Pay-as-you-go sessions"
          delta={hotspotDelta}
          icon={Zap}
          color="bg-warning"
          delay={0.15}
        />
        <StatCard
          title="Active Subscribers"
          value="287"
          subtitle="PPPoE accounts"
          delta={3.2}
          icon={Users}
          color="bg-purple-600"
          delay={0.2}
        />
      </div>

      {/* Revenue chart + Package breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Chart */}
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CardTitle className="text-base">Monthly Revenue Trend</CardTitle>
                <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                  {(["all", "pppoe", "hotspot"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setRevenueFilter(f)}
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-md transition-all capitalize",
                        revenueFilter === f
                          ? "bg-white text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {f === "all" ? "All" : f === "pppoe" ? "PPPoE" : "Hotspot"}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <MiniBarChart data={monthlyRevenue} filter={revenueFilter} />
              <div className="mt-4 flex items-center gap-6">
                {revenueFilter !== "hotspot" && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm bg-success/60" />
                    <span className="text-xs text-muted-foreground">PPPoE</span>
                  </div>
                )}
                {revenueFilter !== "pppoe" && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm bg-warning/60" />
                    <span className="text-xs text-muted-foreground">Hotspot</span>
                  </div>
                )}
                {revenueFilter === "all" && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                    <span className="text-xs text-muted-foreground">Current month</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Package breakdown */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base">Revenue by Package</CardTitle>
                <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                  {(["all", "pppoe", "hotspot"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setRevenueFilter(f)}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-medium rounded-md transition-all capitalize",
                        revenueFilter === f
                          ? "bg-white text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {f === "all" ? "All" : f === "pppoe" ? "PPPoE" : "Hotspot"}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {filteredPkgs.map((pkg) => (
                  <div key={pkg.name} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn("w-1.5 h-8 rounded-full shrink-0", pkg.type === "pppoe" ? "bg-success" : "bg-warning")} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{pkg.name}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{pkg.type}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold tabular-nums">KES {pkg.revenue.toLocaleString()}</p>
                      <div className={cn("flex items-center justify-end gap-0.5 text-[10px] font-medium", pkg.growth >= 0 ? "text-success" : "text-destructive")}>
                        {pkg.growth >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        {Math.abs(pkg.growth)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-base">Recent Transactions</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Last 10 payments · dummy data</p>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                  {(["all", "pppoe", "hotspot"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setTxFilter(f)}
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-md transition-all capitalize",
                        txFilter === f
                          ? "bg-white text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {f === "all" ? "All" : f === "pppoe" ? "PPPoE" : "Hotspot"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Ref</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Customer</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Package</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Method</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Type</th>
                    <th className="text-right px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Amount</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.map((tx, i) => (
                    <tr key={tx.id} className={cn("transition-colors hover:bg-muted/30", i < filteredTx.length - 1 && "border-b border-border")}>
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs text-muted-foreground">{tx.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground text-xs">{tx.customer}</p>
                        <p className="text-[10px] text-muted-foreground">{tx.date}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-foreground truncate max-w-[140px] block">{tx.package}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">{tx.method}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-2 py-0.5 capitalize", tx.type === "pppoe" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20")}
                        >
                          {tx.type === "pppoe" ? "PPPoE" : "Hotspot"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="font-bold text-xs tabular-nums">KES {tx.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={tx.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}