"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw,
  Calendar,
  TrendingDown,
  DollarSign,
  List,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
 AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { useCompanyScope } from "@/providers/CompanyScopeProvider";
import {
 getExpenses,
 getExpenseSummary,
 createExpense,
 deleteExpense,
} from "@/actions/finance";
import type {
 Expense,
 ExpenseCategory,
 ExpenseRequest,
 ExpenseSummary,
 SpringPage,
} from "@/lib/types/finance";

const CATEGORY_BADGES: Record<ExpenseCategory, { label: string; className: string }> = {
 SALARY: { label: "Salary", className: "bg-blue-100 text-blue-700 border-blue-200" },
 EQUIPMENT: { label: "Equipment", className: "bg-purple-100 text-purple-700 border-purple-200" },
 MAINTENANCE: { label: "Maintenance", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
 UTILITIES: { label: "Utilities", className: "bg-cyan-100 text-cyan-700 border-cyan-200" },
 MARKETING: { label: "Marketing", className: "bg-pink-100 text-pink-700 border-pink-200" },
 OTHER: { label: "Other", className: "bg-gray-100 text-gray-700 border-gray-200" },
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
 PENDING: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
 APPROVED: { label: "Approved", className: "bg-success/10 text-success border-success/20" },
 PAID: { label: "Paid", className: "bg-primary/10 text-primary border-primary/20" },
 REJECTED: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

interface ExpenseTableProps {
  /** Server-fetched page; skips the first-mount client fetch when present. */
  initialExpenses?: SpringPage<Expense>;
  initialSummary?: ExpenseSummary | null;
}

export default function ExpenseTable({
  initialExpenses,
  initialSummary = null,
}: ExpenseTableProps) {
  const [expenses, setExpenses] = useState<SpringPage<Expense>>(
    initialExpenses ?? {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
      first: true,
      last: true,
      empty: true,
    }
  );
  const [summary, setSummary] = useState<ExpenseSummary | null>(initialSummary);
  const [loading, setLoading] = useState(!initialExpenses);
 const [error, setError] = useState("");
 const [startDate, setStartDate] = useState(() => {
 const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
 });
 const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
 const [category, setCategory] = useState<string>("");
 const [page, setPage] = useState(0);
 const [dialogOpen, setDialogOpen] = useState(false);
 const { requireCompany } = useCompanyScope();

 // Create expense form state
 const [formAmount, setFormAmount] = useState("");
 const [formDescription, setFormDescription] = useState("");
 const [formCategory, setFormCategory] = useState<ExpenseCategory>("OTHER");
 const [formExpenseType, setFormExpenseType] = useState("");
 const [formPaymentMethod, setFormPaymentMethod] = useState("");
 const [formExpenseDate, setFormExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
 const [formReceiptUrl, setFormReceiptUrl] = useState("");
 const [submitting, setSubmitting] = useState(false);

 const fetchData = useCallback(async () => {
 setLoading(true);
 setError("");
 try {
 const [expRes, sumRes] = await Promise.all([
 getExpenses({ startDate, endDate, category: category as ExpenseCategory || undefined, page, size: 20 }),
 category ? Promise.resolve(null) : getExpenseSummary(startDate, endDate),
 ]);
 if (expRes.success && expRes.data) setExpenses(expRes.data);
 else setError(expRes.message);
 if (sumRes?.success && sumRes.data) setSummary(sumRes.data);
 } catch {
 setError("Failed to load expenses");
 } finally {
 setLoading(false);
 }
 }, [startDate, endDate, category, page]);

// Skip the first-mount fetch only when the server actually supplied data.
// When the server-side seed fails (initialExpenses undefined), fall through and
// fetch client-side so the page is never left stuck with an empty table and a
// spinning, disabled Refresh.
  const skipInitialFetchRef = useRef(Boolean(initialExpenses));

  useEffect(() => {
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      return;
    }
    fetchData();
  }, [fetchData]);

 const handleCreate = async () => {
 if (!formAmount || !formDescription) {
 toast.error("Amount and description are required");
 return;
 }
 setSubmitting(true);
 try {
 const payload: ExpenseRequest = {
 amount: parseFloat(formAmount),
 description: formDescription,
 category: formCategory,
 expenseType: formExpenseType || undefined,
 paymentMethod: formPaymentMethod || undefined,
 expenseDate: formExpenseDate,
 receiptUrl: formReceiptUrl || undefined,
 };
 const res = await createExpense(payload);
 if (res.success) {
 toast.success("Expense created");
 setDialogOpen(false);
 setFormAmount("");
 setFormDescription("");
 setFormCategory("OTHER");
 setFormExpenseType("");
 setFormPaymentMethod("");
 setFormReceiptUrl("");
 fetchData();
 } else {
 toast.error(res.message || "Failed to create expense");
 }
 } catch {
 toast.error("Failed to create expense");
 } finally {
 setSubmitting(false);
 }
 };

 const columns: ColumnDef<Expense>[] = [
 { accessorKey: "expenseDate", header: "Date", cell: ({ row }) => new Date(row.getValue("expenseDate")).toLocaleDateString() },
 { accessorKey: "description", header: "Description", cell: ({ row }) => <span className="max-w-[180px] truncate block">{row.getValue("description")}</span> },
 {
 accessorKey: "category",
 header: "Category",
 cell: ({ row }) => {
 const cat = row.getValue("category") as ExpenseCategory;
 const b = CATEGORY_BADGES[cat] || CATEGORY_BADGES.OTHER;
 return <Badge variant="outline" className={cn("text-[10px]", b.className)}>{b.label}</Badge>;
 },
 },
 {
 accessorKey: "amount",
 header: "Amount",
 cell: ({ row }) => <span className="font-medium tabular-nums">KES {row.getValue<number>("amount").toLocaleString()}</span>,
 },
 { accessorKey: "tax", header: "Tax", cell: ({ row }) => <span className="tabular-nums">KES {(row.getValue("tax") as number || 0).toLocaleString()}</span> },
 {
 accessorKey: "status",
 header: "Status",
 cell: ({ row }) => {
 const s = row.getValue("status") as string;
 const b = STATUS_BADGES[s] || STATUS_BADGES.PENDING;
 return <Badge variant="outline" className={cn("text-[10px]", b.className)}>{b.label}</Badge>;
 },
 },
 { accessorKey: "paymentMethod", header: "Method", cell: ({ row }) => <span className="text-xs">{row.getValue("paymentMethod") || "—"}</span> },
 {
 id: "actions",
 cell: ({ row }) => {
 const expense = row.original;
 return (
 <AlertDialog>
 <AlertDialogTrigger asChild>
 <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive">
 <Trash2 className="w-3.5 h-3.5" />
 </Button>
 </AlertDialogTrigger>
 <AlertDialogContent>
 <AlertDialogHeader>
 <AlertDialogTitle>Delete Expense</AlertDialogTitle>
 <AlertDialogDescription>
 Are you sure you want to delete this expense? This action cannot be undone.
 </AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter>
 <AlertDialogCancel>Cancel</AlertDialogCancel>
 <AlertDialogAction
 onClick={async () => {
 const res = await deleteExpense(expense.id);
 if (res.success) {
 toast.success("Expense deleted");
 fetchData();
 } else {
 toast.error(res.message || "Failed to delete expense");
 }
 }}
 >
 Delete
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 );
 },
 },
 ];

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
 <h1 className="text-2xl font-normal tracking-normal">Expense Management</h1>
 <p className="text-sm text-muted-foreground">Track and manage operational expenses</p>
 </div>
 <div className="flex items-center gap-2">
 <Dialog open={dialogOpen} onOpenChange={(open) => (open ? requireCompany(() => setDialogOpen(true)) : setDialogOpen(false))}>
 <DialogTrigger asChild>
 <Button size="sm" className="h-8 gap-1">
 <Plus className="w-3.5 h-3.5" /> Add Expense
 </Button>
 </DialogTrigger>
 <DialogContent className="sm:max-w-[425px]">
 <DialogHeader>
 <DialogTitle>Create Expense</DialogTitle>
 </DialogHeader>
 <div className="space-y-4 py-2">
 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <Label className="text-xs">Amount (KES) *</Label>
 <Input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0.00" />
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs">Date *</Label>
 <Input type="date" value={formExpenseDate} onChange={(e) => setFormExpenseDate(e.target.value)} />
 </div>
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs">Description *</Label>
 <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="What was this for?" />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <Label className="text-xs">Category</Label>
 <Select value={formCategory} onValueChange={(v) => setFormCategory(v as ExpenseCategory)}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 {Object.entries(CATEGORY_BADGES).map(([k, v]) => (
 <SelectItem key={k} value={k}>{v.label}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs">Expense Type</Label>
 <Input value={formExpenseType} onChange={(e) => setFormExpenseType(e.target.value)} placeholder="e.g. Monthly" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <Label className="text-xs">Payment Method</Label>
 <Input value={formPaymentMethod} onChange={(e) => setFormPaymentMethod(e.target.value)} placeholder="M-Pesa, Cash..." />
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs">Receipt URL</Label>
 <Input value={formReceiptUrl} onChange={(e) => setFormReceiptUrl(e.target.value)} placeholder="https://..." />
 </div>
 </div>
 <Button className="w-full" onClick={handleCreate} disabled={submitting}>
 {submitting ? "Creating..." : "Create Expense"}
 </Button>
 </div>
 </DialogContent>
 </Dialog>
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

 {/* KPI Summary */}
 {summary && !category && (
 <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
 <Card>
 <CardContent className="pt-5 pb-4 px-5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-primary" /></div>
 <div>
 <p className="text-xs text-muted-foreground">Total Amount</p>
 <p className="text-xl font-bold tabular-nums">KES {summary.totalAmount.toLocaleString()}</p>
 </div>
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="pt-5 pb-4 px-5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-destructive" /></div>
 <div>
 <p className="text-xs text-muted-foreground">Total Count</p>
 <p className="text-xl font-bold">{summary.totalCount}</p>
 </div>
 </div>
 </CardContent>
 </Card>
 {Object.entries(summary.byCategory).map(([cat, amt]) => (
 <Card key={cat}>
 <CardContent className="pt-5 pb-4 px-5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><List className="w-5 h-5 text-muted-foreground" /></div>
 <div>
 <p className="text-xs text-muted-foreground">{CATEGORY_BADGES[cat as ExpenseCategory]?.label || cat}</p>
 <p className="text-xl font-bold tabular-nums">KES {amt.toLocaleString()}</p>
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 )}

 {/* Filters */}
 <div className="flex items-center gap-3 flex-wrap">
 <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
 <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(0); }} className="h-8 w-36 text-xs" />
 <span className="text-xs text-muted-foreground">to</span>
 <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(0); }} className="h-8 w-36 text-xs" />
 <Select value={category} onValueChange={(v) => { setCategory(v); setPage(0); }}>
 <SelectTrigger className="h-8 w-36 text-xs">
 <SelectValue placeholder="All categories" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All categories</SelectItem>
 {Object.entries(CATEGORY_BADGES).map(([k, v]) => (
 <SelectItem key={k} value={k}>{v.label}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

{/* Table */}
  <Card>
    <CardContent className="p-0">
      <DataTable columns={columns} data={Array.isArray(expenses.content) ? expenses.content : []} />
 {expenses.totalPages > 1 && (
 <div className="flex items-center justify-between px-4 pb-4 pt-2">
 <p className="text-xs text-muted-foreground">
 Page {expenses.number + 1} of {expenses.totalPages} ({expenses.totalElements} total)
 </p>
 <div className="flex gap-2">
 <Button variant="outline" size="sm" disabled={expenses.first} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</Button>
 <Button variant="outline" size="sm" disabled={expenses.last} onClick={() => setPage((p) => p + 1)}>Next</Button>
 </div>
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 );
}