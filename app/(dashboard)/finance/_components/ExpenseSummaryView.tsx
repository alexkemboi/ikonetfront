"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
 AlertCircle,
 RefreshCw,
 Calendar,
 DollarSign,
 TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getExpenseSummary } from "@/actions/finance";
import type { ExpenseCategory, ExpenseSummary } from "@/lib/types/finance";

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
 SALARY: "Salary",
 EQUIPMENT: "Equipment",
 MAINTENANCE: "Maintenance",
 UTILITIES: "Utilities",
 MARKETING: "Marketing",
 OTHER: "Other",
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
 SALARY: "bg-blue-500",
 EQUIPMENT: "bg-purple-500",
 MAINTENANCE: "bg-yellow-500",
 UTILITIES: "bg-cyan-500",
 MARKETING: "bg-pink-500",
 OTHER: "bg-gray-500",
};

export default function ExpenseSummaryView() {
 const [summary, setSummary] = useState<ExpenseSummary | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const [startDate, setStartDate] = useState(() => {
 const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
 });
 const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

 const fetchData = useCallback(async () => {
 setLoading(true);
 setError("");
 try {
 const res = await getExpenseSummary(startDate, endDate);
 if (res.success && res.data) setSummary(res.data);
 else setError(res.message);
 } catch {
 setError("Failed to load expense summary");
 } finally {
 setLoading(false);
 }
 }, [startDate, endDate]);

 useEffect(() => {
 fetchData();
 }, [fetchData]);

 const maxCategory = summary ? Math.max(...Object.values(summary.byCategory), 1) : 1;

 return (
 <div className="space-y-6 p-8 pt-6">
 <motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.3 }}
 className="flex items-start justify-between gap-4"
 >
 <div>
 <Badge className="bg-primary/10 text-primary border-primary/20 text-xs mb-1" variant="outline">Finance</Badge>
 <h1 className="text-2xl font-normal tracking-normal">Expense Summary</h1>
 <p className="text-sm text-muted-foreground">Category breakdown and trends</p>
 </div>
 <div className="flex items-center gap-2">
 <div className="flex items-center gap-2">
 <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
 <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 w-32 text-xs" />
 <span className="text-xs text-muted-foreground">to</span>
 <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 w-32 text-xs" />
 </div>
 <Button variant="outline" size="sm" className="h-8 gap-1" onClick={fetchData} disabled={loading}>
 <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Refresh
 </Button>
 </div>
 </motion.div>

 {error && (
 <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
 <AlertCircle className="w-4 h-4 shrink-0" />
 <span>{error}</span>
 <Button variant="outline" size="sm" className="ml-auto h-7" onClick={fetchData}>Retry</Button>
 </div>
 )}

 {loading ? (
 <div className="animate-pulse space-y-6">
 <div className="grid grid-cols-2 gap-4">
 <div className="h-28 rounded-xl bg-muted" />
 <div className="h-28 rounded-xl bg-muted" />
 </div>
 <div className="h-80 rounded-xl bg-muted" />
 </div>
 ) : summary ? (
 <>
 {/* Stat cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <Card>
 <CardContent className="pt-5 pb-4 px-5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-primary" /></div>
 <div>
 <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Expenses</p>
 <p className="text-2xl font-bold tabular-nums">KES {summary.totalAmount.toLocaleString()}</p>
 </div>
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="pt-5 pb-4 px-5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-destructive" /></div>
 <div>
 <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Count</p>
 <p className="text-2xl font-bold">{summary.totalCount} entries</p>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Category breakdown bars */}
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-base">Category Breakdown</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-4">
 {(Object.entries(summary.byCategory) as [ExpenseCategory, number][])
 .sort(([, a], [, b]) => b - a)
 .map(([cat, amount]) => {
 const pct = (amount / summary.totalAmount) * 100;
 const barWidth = maxCategory > 0 ? (amount / maxCategory) * 100 : 0;
 return (
 <div key={cat}>
 <div className="flex justify-between text-sm mb-1">
 <span className="font-medium">{CATEGORY_LABELS[cat] || cat}</span>
 <span className="tabular-nums font-medium">KES {amount.toLocaleString()} ({pct.toFixed(1)}%)</span>
 </div>
 <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
 <div
 className={cn("h-full rounded-full transition-all duration-500", CATEGORY_COLORS[cat] || "bg-gray-500")}
 style={{ width: `${barWidth}%` }}
 />
 </div>
 </div>
 );
 })}
 </div>
 </CardContent>
 </Card>

 {/* Simple pie-like visualization using stacked bar */}
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-base">Expense Distribution</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="w-full h-6 rounded-full overflow-hidden flex">
 {(Object.entries(summary.byCategory) as [ExpenseCategory, number][])
 .filter(([, amount]) => amount > 0)
 .map(([cat, amount]) => {
 const pct = (amount / summary.totalAmount) * 100;
 return (
 <div
 key={cat}
 className={cn("h-full first:rounded-l-full last:rounded-r-full", CATEGORY_COLORS[cat] || "bg-gray-500")}
 style={{ width: `${pct}%` }}
 title={`${CATEGORY_LABELS[cat] || cat}: ${pct.toFixed(1)}%`}
 />
 );
 })}
 </div>
 <div className="flex flex-wrap gap-4 mt-4">
 {(Object.entries(summary.byCategory) as [ExpenseCategory, number][])
 .filter(([, amount]) => amount > 0)
 .map(([cat, amount]) => {
 const pct = (amount / summary.totalAmount) * 100;
 return (
 <div key={cat} className="flex items-center gap-2">
 <div className={cn("w-3 h-3 rounded", CATEGORY_COLORS[cat] || "bg-gray-500")} />
 <span className="text-xs text-muted-foreground">
 {CATEGORY_LABELS[cat] || cat} ({pct.toFixed(1)}%)
 </span>
 </div>
 );
 })}
 </div>
 </CardContent>
 </Card>
 </>
 ) : (
 <div className="text-center py-12 text-muted-foreground">No expense data available</div>
 )}
 </div>
 );
}