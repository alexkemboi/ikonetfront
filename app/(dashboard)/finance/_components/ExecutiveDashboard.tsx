"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
 DollarSign,
 TrendingUp,
 TrendingDown,
 Wifi,
 Zap,
 AlertCircle,
 RefreshCw,
 Calendar,
 Wallet,
 CheckCircle2,
 XCircle,
 ArrowUpRight,
 ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
 getProfitAndLossDashboard,
 getTrialBalance,
 getAccountBalances,
} from "@/actions/finance";
import type {
 ProfitAndLossSummary,
 TrialBalanceResponse,
 AccountBalanceProjection,
} from "@/lib/types/finance";
import FinanceDashboard from "./FinanceDashboard";

function StatCard({
 title,
 value,
 subtitle,
 delta,
 icon: Icon,
 color,
 loading,
 delay = 0,
}: {
 title: string;
 value: string;
 subtitle: string;
 delta?: number;
 icon: React.ElementType;
 color: string;
 loading?: boolean;
 delay?: number;
}) {
 if (loading) {
 return (
 <Card>
 <CardContent className="pt-5 pb-4 px-5">
 <div className="animate-pulse space-y-3">
 <div className="h-3 w-24 bg-muted rounded" />
 <div className="h-7 w-32 bg-muted rounded" />
 <div className="h-3 w-20 bg-muted rounded" />
 </div>
 </CardContent>
 </Card>
 );
 }
 const positive = delta !== undefined && delta >= 0;
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
 <Icon className="w-5 h-5 text-foreground" />
 </div>
 </div>
 {delta !== undefined && (
 <div className={cn("flex items-center gap-1 mt-3 text-xs font-semibold", positive ? "text-success" : "text-destructive")}>
 {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
 {Math.abs(delta)}% vs last period
 </div>
 )}
 </CardContent>
 </Card>
 </motion.div>
 );
}

export default function ExecutiveDashboard() {
 const [startDate, setStartDate] = useState("");
 const [endDate, setEndDate] = useState("");
 const [pnl, setPnl] = useState<ProfitAndLossSummary | null>(null);
 const [trialBalance, setTrialBalance] = useState<TrialBalanceResponse | null>(null);
 const [balances, setBalances] = useState<AccountBalanceProjection[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");

 const fetchData = useCallback(async () => {
 setLoading(true);
 setError("");
 try {
 const [pnlRes, tbRes, balRes] = await Promise.all([
 getProfitAndLossDashboard(startDate || undefined, endDate || undefined),
 getTrialBalance(),
 getAccountBalances(),
 ]);
 if (pnlRes.success && pnlRes.data) setPnl(pnlRes.data);
 else if (!pnlRes.success) setError(pnlRes.message);
 if (tbRes.success && tbRes.data) setTrialBalance(tbRes.data);
 if (balRes.success && balRes.data) setBalances(balRes.data);
 } catch {
 setError("Failed to load dashboard data");
 } finally {
 setLoading(false);
 }
 }, [startDate, endDate]);

 useEffect(() => {
 fetchData();
 }, [fetchData]);

 const formatKes = (n: number) => `KES ${n.toLocaleString()}`;

 return (
 <div className="space-y-6 p-8 pt-6">
 {/* Header */}
 <motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.3 }}
 className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
 >
 <div>
 <Badge className="bg-primary/10 text-primary border-primary/20 text-xs mb-1" variant="outline">Finance</Badge>
 <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
 <p className="text-sm text-muted-foreground">Profit & Loss · Trial Balance · Account Balances</p>
 </div>
 <div className="flex items-center gap-2 flex-wrap">
 <div className="flex items-center gap-2">
 <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
 <input
 type="date"
 value={startDate}
 onChange={(e) => setStartDate(e.target.value)}
 className="h-8 rounded-md border border-input bg-background px-2 text-xs"
 />
 <span className="text-xs text-muted-foreground">to</span>
 <input
 type="date"
 value={endDate}
 onChange={(e) => setEndDate(e.target.value)}
 className="h-8 rounded-md border border-input bg-background px-2 text-xs"
 />
 </div>
 <Button variant="outline" size="sm" className="h-8 gap-1" onClick={fetchData} disabled={loading}>
 <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
 Refresh
 </Button>
 </div>
 </motion.div>

 {/* Error banner */}
 {error && (
 <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
 <AlertCircle className="w-4 h-4 shrink-0" />
 <span>{error}</span>
 <Button variant="outline" size="sm" className="ml-auto h-7 text-xs" onClick={fetchData}>
 Retry
 </Button>
 </div>
 )}

 {/* KPI cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
 <StatCard
 title="Total Revenue"
 value={pnl ? formatKes(pnl.totalRevenue) : "—"}
 subtitle={`${pnl ? new Date(pnl.startDate).toLocaleDateString() : ""} - ${pnl ? new Date(pnl.endDate).toLocaleDateString() : ""}`}
 icon={DollarSign}
 color="bg-primary"
 loading={loading}
 delay={0.05}
 />
 <StatCard
 title="Total Expenses"
 value={pnl ? formatKes(pnl.totalExpenses) : "—"}
 subtitle="All categories"
 icon={Wallet}
 color="bg-destructive"
 loading={loading}
 delay={0.1}
 />
 <StatCard
 title="Net Profit"
 value={pnl ? formatKes(pnl.netProfit) : "—"}
 subtitle={pnl && pnl.netProfit >= 0 ? "Profitable" : "Loss"}
 delta={pnl && pnl.totalRevenue > 0 ? Math.round(((pnl.netProfit / pnl.totalRevenue) * 100) * 10) / 10 : undefined}
 icon={pnl && pnl.netProfit >= 0 ? TrendingUp : TrendingDown}
 color={pnl && pnl.netProfit >= 0 ? "bg-success" : "bg-destructive"}
 loading={loading}
 delay={0.15}
 />
 <StatCard
 title="PPPoE Revenue"
 value={pnl?.pppoeRevenue ? formatKes(pnl.pppoeRevenue) : "—"}
 subtitle="Monthly subscriptions"
 icon={Wifi}
 color="bg-success"
 loading={loading}
 delay={0.2}
 />
 <StatCard
 title="Hotspot Revenue"
 value={pnl?.hotspotRevenue ? formatKes(pnl.hotspotRevenue) : "—"}
 subtitle="Pay-as-you-go sessions"
 icon={Zap}
 color="bg-warning"
 loading={loading}
 delay={0.25}
 />
 </div>

 {/* Trial Balance + Account Balances */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Trial Balance */}
 <motion.div
 className="lg:col-span-1"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, delay: 0.3 }}
 >
 <Card className="h-full">
 <CardHeader className="pb-3">
 <div className="flex items-center justify-between">
 <CardTitle className="text-base">Trial Balance</CardTitle>
 {trialBalance && (
 <Badge
 variant="outline"
 className={cn(
 "text-xs",
 trialBalance.isBalanced
 ? "bg-success/10 text-success border-success/20"
 : "bg-destructive/10 text-destructive border-destructive/20"
 )}
 >
 {trialBalance.isBalanced ? (
 <><CheckCircle2 className="w-3 h-3 mr-1" /> Balanced</>
 ) : (
 <><XCircle className="w-3 h-3 mr-1" /> Unbalanced</>
 )}
 </Badge>
 )}
 </div>
 </CardHeader>
 <CardContent>
 {loading ? (
 <div className="animate-pulse space-y-3">
 <div className="h-4 w-full bg-muted rounded" />
 <div className="h-4 w-3/4 bg-muted rounded" />
 <div className="h-4 w-1/2 bg-muted rounded" />
 </div>
 ) : trialBalance ? (
 <div className="space-y-3">
 <div className="flex justify-between text-sm">
 <span className="text-muted-foreground">Debits</span>
 <span className="font-medium tabular-nums">{formatKes(trialBalance.debits)}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-muted-foreground">Credits</span>
 <span className="font-medium tabular-nums">{formatKes(trialBalance.credits)}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-muted-foreground">Delta</span>
 <span className={cn("font-medium tabular-nums", trialBalance.delta !== 0 ? "text-destructive" : "text-success")}>
 {formatKes(Math.abs(trialBalance.delta))}
 </span>
 </div>
 <div className="border-t pt-3 mt-3">
 <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Accounts ({trialBalance.accounts.length})</p>
 <div className="max-h-[200px] overflow-y-auto space-y-1">
 {trialBalance.accounts.map((acct) => (
 <div key={acct.code} className="flex justify-between text-xs py-1">
 <span className="text-muted-foreground truncate">{acct.code} — {acct.name}</span>
 <span className="font-medium tabular-nums">{formatKes(acct.balance)}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 ) : (
 <p className="text-sm text-muted-foreground">No trial balance data</p>
 )}
 </CardContent>
 </Card>
 </motion.div>

 {/* Account Balances */}
 <motion.div
 className="lg:col-span-2"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, delay: 0.35 }}
 >
 <Card className="h-full">
 <CardHeader className="pb-3">
 <CardTitle className="text-base">Account Balances</CardTitle>
 </CardHeader>
 <CardContent>
 {loading ? (
 <div className="animate-pulse space-y-3">
 {Array.from({ length: 5 }).map((_, i) => (
 <div key={i} className="h-4 w-full bg-muted rounded" />
 ))}
 </div>
 ) : balances.length > 0 ? (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-border">
 <th className="text-left py-2 text-xs font-medium text-muted-foreground">Account Code</th>
 <th className="text-right py-2 text-xs font-medium text-muted-foreground">Balance</th>
 <th className="text-right py-2 text-xs font-medium text-muted-foreground">Postings</th>
 </tr>
 </thead>
 <tbody>
 {balances.map((b) => (
 <tr key={b.accountCode} className="border-b border-border last:border-0">
 <td className="py-2 text-xs font-mono">{b.accountCode}{b.accountName ? ` — ${b.accountName}` : ""}</td>
 <td className={cn("py-2 text-xs text-right font-medium tabular-nums", b.balance >= 0 ? "text-success" : "text-destructive")}>
 {formatKes(b.balance)}
 </td>
 <td className="py-2 text-xs text-right text-muted-foreground">{b.postingCount}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 ) : (
 <p className="text-sm text-muted-foreground">No account balances available</p>
 )}
 </CardContent>
 </Card>
 </motion.div>
 </div>

 {/* Legacy FinanceDashboard integrated below */}
 <div className="border-t pt-6">
 <FinanceDashboard />
 </div>
 </div>
 );
}