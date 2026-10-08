"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import {
 Plus,
 Download,
 Eye,
 AlertCircle,
 RefreshCw,
 FileText,
 Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/shared/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { useCompanyScope } from "@/providers/CompanyScopeProvider";
import Link from "next/link";
import {
 getCustomerStatements,
 generateStatement,
 downloadStatementPdf,
} from "@/actions/finance";
import type { Statement, StatementRequest, SpringPage } from "@/lib/types/finance";

const columns: ColumnDef<Statement>[] = [
 {
 id: "period",
 header: "Period",
 cell: ({ row }) => {
 const s = row.original;
 return (
 <span className="text-xs">
 {new Date(s.startDate).toLocaleDateString()} — {new Date(s.endDate).toLocaleDateString()}
 </span>
 );
 },
 },
 {
 accessorKey: "totalCharges",
 header: "Total Charges",
 cell: ({ row }) => <span className="tabular-nums font-medium">KES {row.getValue<number>("totalCharges").toLocaleString()}</span>,
 },
 {
 accessorKey: "totalPayments",
 header: "Total Payments",
 cell: ({ row }) => <span className="tabular-nums font-medium">KES {row.getValue<number>("totalPayments").toLocaleString()}</span>,
 },
 {
 accessorKey: "balanceDue",
 header: "Balance Due",
 cell: ({ row }) => {
 const bal = row.getValue<number>("balanceDue");
 return (
 <span className={cn("tabular-nums font-medium", bal > 0 ? "text-destructive" : "text-success")}>
 KES {bal.toLocaleString()}
 </span>
 );
 },
 },
 {
 accessorKey: "createdAt",
 header: "Created",
 cell: ({ row }) => <span className="text-xs">{new Date(row.getValue("createdAt")).toLocaleDateString()}</span>,
 },
 {
 id: "actions",
 cell: ({ row }) => {
 const stmt = row.original;
 return (
 <div className="flex items-center gap-1">
 <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
 <Link href={`/finance/statements/${stmt.id}?customerId=${stmt.customerId}`}>
 <Eye className="w-3.5 h-3.5" />
 </Link>
 </Button>
 <Button
 variant="ghost"
 size="sm"
 className="h-7 w-7 p-0"
 onClick={async () => {
 const buffer = await downloadStatementPdf(stmt.id);
 if (buffer) {
 const blob = new Blob([buffer], { type: "application/pdf" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `statement-${stmt.id}.pdf`;
 a.click();
 URL.revokeObjectURL(url);
 } else {
 toast.error("Failed to download PDF");
 }
 }}
 >
 <Download className="w-3.5 h-3.5" />
 </Button>
 </div>
 );
 },
 },
];

export default function StatementExplorer() {
 const [customerId, setCustomerId] = useState("");
 const [statements, setStatements] = useState<SpringPage<Statement>>({ content: [], totalElements: 0, totalPages: 0, size: 20, number: 0, first: true, last: true, empty: true });
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [page, setPage] = useState(0);
 const [pageSize, setPageSize] = useState(20);
 const [dialogOpen, setDialogOpen] = useState(false);
 const { requireCompany } = useCompanyScope();

 // Generate form
 const [genCustomerId, setGenCustomerId] = useState("");
 const [genStartDate, setGenStartDate] = useState("");
 const [genEndDate, setGenEndDate] = useState("");
 const [genYearMonth, setGenYearMonth] = useState("");
 const [submitting, setSubmitting] = useState(false);

 const fetchData = useCallback(async (targetPage: number, targetSize: number) => {
 if (!customerId) return;
 setLoading(true);
 setError("");
 try {
 const res = await getCustomerStatements(parseInt(customerId), targetPage, targetSize);
 if (res.success && res.data) setStatements(res.data);
 else setError(res.message);
 } catch {
 setError("Failed to fetch statements");
 } finally {
 setLoading(false);
 }
 }, [customerId]);

 const handleSearch = () => {
 setPage(0);
 fetchData(0, pageSize);
 };

 const handleGenerate = async () => {
 if (!genCustomerId) {
 toast.error("Customer ID is required");
 return;
 }
 setSubmitting(true);
 try {
 const payload: StatementRequest = {
 customerId: parseInt(genCustomerId),
 startDate: genStartDate || undefined,
 endDate: genEndDate || undefined,
 yearMonth: genYearMonth || undefined,
 };
 const res = await generateStatement(payload);
 if (res.success) {
 toast.success("Statement generated");
 setDialogOpen(false);
 setGenCustomerId("");
 setGenStartDate("");
 setGenEndDate("");
 setGenYearMonth("");
 fetchData(page, pageSize);
 } else {
 toast.error(res.message || "Failed to generate statement");
 }
 } catch {
 toast.error("Failed to generate statement");
 } finally {
 setSubmitting(false);
 }
 };

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
 <h1 className="text-2xl font-normal tracking-normal">Customer Statements</h1>
 <p className="text-sm text-muted-foreground">View, generate, and download statements</p>
 </div>
 <div className="flex items-center gap-2">
 <Dialog open={dialogOpen} onOpenChange={(open) => (open ? requireCompany(() => setDialogOpen(true)) : setDialogOpen(false))}>
 <DialogTrigger asChild>
 <Button size="sm" className="h-8 gap-1">
 <Plus className="w-3.5 h-3.5" /> Generate Statement
 </Button>
 </DialogTrigger>
 <DialogContent className="sm:max-w-[400px]">
 <DialogHeader>
 <DialogTitle>Generate Statement</DialogTitle>
 </DialogHeader>
 <div className="space-y-4 py-2">
 <div className="space-y-1.5">
 <Label className="text-xs">Customer ID *</Label>
 <Input type="number" value={genCustomerId} onChange={(e) => setGenCustomerId(e.target.value)} placeholder="Enter customer ID" />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <Label className="text-xs">Start Date</Label>
 <Input type="date" value={genStartDate} onChange={(e) => setGenStartDate(e.target.value)} />
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs">End Date</Label>
 <Input type="date" value={genEndDate} onChange={(e) => setGenEndDate(e.target.value)} />
 </div>
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs">Year-Month (alternative, e.g. 2026-05)</Label>
 <Input type="month" value={genYearMonth} onChange={(e) => setGenYearMonth(e.target.value)} />
 </div>
 <Button className="w-full" onClick={handleGenerate} disabled={submitting}>
 {submitting ? "Generating..." : "Generate"}
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleSearch} disabled={loading}>
 <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Refresh
 </Button>
 </div>
 </motion.div>

 {error && (
 <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
 <AlertCircle className="w-4 h-4 shrink-0" />
 <span>{error}</span>
 <Button variant="outline" size="sm" className="ml-auto h-7" onClick={handleSearch}>Retry</Button>
 </div>
 )}

 {/* Customer search */}
 <div className="flex items-center gap-3">
 <Search className="w-4 h-4 text-muted-foreground" />
 <Input
 type="number"
 placeholder="Enter Customer ID"
 value={customerId}
 onChange={(e) => setCustomerId(e.target.value)}
 onKeyDown={(e) => e.key === "Enter" && handleSearch()}
 className="h-9 w-48 text-sm"
 />
 <Button size="sm" className="h-9" onClick={handleSearch} disabled={!customerId}>
 Load Statements
 </Button>
 </div>

 {/* Statements table */}
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-base flex items-center gap-2">
 <FileText className="w-4 h-4" />
 Statements
 {statements.totalElements > 0 && (
 <Badge variant="secondary" className="text-xs font-normal">
 {statements.totalElements} found
 </Badge>
 )}
 </CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 {customerId ? (
 <DataTable
 columns={columns}
 data={statements.content}
 loading={loading}
 manualPagination
 pageCount={statements.totalPages}
 pageIndex={statements.number}
 pageSize={pageSize}
 totalRows={statements.totalElements}
 onPaginationChange={(pageIndex, newPageSize) => {
 if (newPageSize !== pageSize) {
 setPageSize(newPageSize);
 setPage(0);
 fetchData(0, newPageSize);
 } else {
 setPage(pageIndex);
 fetchData(pageIndex, pageSize);
 }
 }}
 hideSearch
 />
 ) : (
 <div className="py-12 text-center text-muted-foreground text-sm">
 Enter a customer ID to view their statements
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 );
}