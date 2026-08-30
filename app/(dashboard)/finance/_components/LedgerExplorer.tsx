"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  AlertCircle,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
 getChartOfAccountsTree,
 getLedgerPostings,
} from "@/actions/finance";
import type {
 ChartOfAccountNode,
 AccountPosting,
 CoaType,
 SpringPage,
} from "@/lib/types/finance";

const COA_COLORS: Record<CoaType, string> = {
 ASSET: "text-blue-600 bg-blue-50 border-blue-200",
 LIABILITY: "text-orange-600 bg-orange-50 border-orange-200",
 EQUITY: "text-purple-600 bg-purple-50 border-purple-200",
 INCOME: "text-green-600 bg-green-50 border-green-200",
 EXPENSE: "text-red-600 bg-red-50 border-red-200",
};

function AccountTreeNode({
 node,
 depth,
 selectedCode,
 onSelect,
}: {
 node: ChartOfAccountNode;
 depth: number;
 selectedCode: string | null;
 onSelect: (code: string) => void;
}) {
 const [open, setOpen] = useState(depth < 2);
 const hasChildren = node.children && node.children.length > 0;

 return (
 <div>
 <div
 className={cn(
 "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors text-sm",
 selectedCode === node.code
 ? "bg-primary/10 text-primary"
 : "hover:bg-muted",
 !node.isActive && "opacity-50"
 )}
 style={{ paddingLeft: `${12 + depth * 16}px` }}
 onClick={() => onSelect(node.code)}
 >
 {hasChildren ? (
 <button
 onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
 className="w-4 h-4 shrink-0 flex items-center justify-center"
 >
 {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
 </button>
 ) : (
 <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
 )}
 <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-mono", COA_COLORS[node.type])}>
 {node.type}
 </Badge>
 <span className="font-mono text-xs text-muted-foreground">{node.code}</span>
 <span className="truncate">{node.name}</span>
 {!node.isActive && (
 <Badge variant="outline" className="text-[9px] px-1 py-0 text-muted-foreground">inactive</Badge>
 )}
 </div>
 {hasChildren && open && (
 <div>
 {node.children!.map((child) => (
 <AccountTreeNode
 key={child.code}
 node={child}
 depth={depth + 1}
 selectedCode={selectedCode}
 onSelect={onSelect}
 />
 ))}
 </div>
 )}
 </div>
 );
}

const columns: ColumnDef<AccountPosting>[] = [
 { accessorKey: "occurredAt", header: "Date", cell: ({ row }) => new Date(row.getValue("occurredAt")).toLocaleDateString() },
 { accessorKey: "accountCode", header: "Account", cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("accountCode")}</span> },
 { accessorKey: "sourceType", header: "Source" },
 {
 accessorKey: "amount",
 header: "Amount",
 cell: ({ row }) => {
 const amt = row.getValue("amount") as number;
 return (
 <span className={cn("font-medium tabular-nums", amt >= 0 ? "text-success" : "text-destructive")}>
 {amt >= 0 ? "+" : ""}{amt.toLocaleString()}
 </span>
 );
 },
 },
 { accessorKey: "currency", header: "Currency", cell: ({ row }) => <span className="text-xs">{row.getValue("currency")}</span> },
 { accessorKey: "memo", header: "Memo", cell: ({ row }) => <span className="text-muted-foreground truncate max-w-[150px] block">{row.getValue("memo") || "—"}</span> },
 { accessorKey: "serviceType", header: "Service", cell: ({ row }) => <span className="text-xs">{row.getValue("serviceType") || "—"}</span> },
 { accessorKey: "customerId", header: "Customer ID", cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("customerId") || "—"}</span> },
];

export default function LedgerExplorer() {
 const [tree, setTree] = useState<ChartOfAccountNode[]>([]);
 const [postings, setPostings] = useState<SpringPage<AccountPosting>>({ content: [], totalElements: 0, totalPages: 0, size: 20, number: 0, first: true, last: true, empty: true });
 const [selectedCode, setSelectedCode] = useState<string | null>(null);
 const [page, setPage] = useState(0);
 const [fromDate, setFromDate] = useState("");
 const [toDate, setToDate] = useState("");
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");

 const fetchPostings = useCallback(async () => {
 try {
 const res = await getLedgerPostings({
 accountCode: selectedCode || undefined,
 page,
 size: 20,
 fromDate: fromDate || undefined,
 toDate: toDate || undefined,
 });
 if (res.success && res.data) {
 setPostings(res.data);
 } else {
 setError(res.message);
 }
 } catch {
 setError("Failed to fetch postings");
 }
 }, [selectedCode, page, fromDate, toDate]);

 useEffect(() => {
 setLoading(true);
 async function init() {
 try {
 const treeRes = await getChartOfAccountsTree();
 if (treeRes.success && treeRes.data) setTree(treeRes.data);
 else setError(treeRes.message);
 } catch {
 setError("Failed to load chart of accounts");
 } finally {
 setLoading(false);
 }
 }
 init();
 }, []);

 useEffect(() => {
 fetchPostings();
 }, [fetchPostings]);

 const handleSelect = (code: string) => {
 setSelectedCode(code === selectedCode ? null : code);
 setPage(0);
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
 <h1 className="text-2xl font-bold tracking-tight">Chart of Accounts & Ledger</h1>
 <p className="text-sm text-muted-foreground">Browse accounts and view postings</p>
 </div>
 <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => { fetchPostings(); }}>
 <RefreshCw className="w-3.5 h-3.5" /> Refresh
 </Button>
 </motion.div>

 {error && (
 <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
 <AlertCircle className="w-4 h-4 shrink-0" />
 <span>{error}</span>
 <Button variant="outline" size="sm" className="ml-auto h-7 text-xs" onClick={() => setError("")}>Dismiss</Button>
 </div>
 )}

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* COA Tree */}
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-base">Chart of Accounts</CardTitle>
 </CardHeader>
 <CardContent>
 {loading ? (
 <div className="animate-pulse space-y-2">
 {Array.from({ length: 8 }).map((_, i) => (
 <div key={i} className="h-6 bg-muted rounded" style={{ marginLeft: `${i % 3 * 16}px` }} />
 ))}
 </div>
 ) : tree.length > 0 ? (
 <div className="max-h-[500px] overflow-y-auto">
 {tree.map((node) => (
 <AccountTreeNode
 key={node.code}
 node={node}
 depth={0}
 selectedCode={selectedCode}
 onSelect={handleSelect}
 />
 ))}
 </div>
 ) : (
 <p className="text-sm text-muted-foreground">No chart of accounts data</p>
 )}
 </CardContent>
 </Card>

 {/* Postings */}
 <Card>
 <CardHeader className="pb-3">
 <div className="flex items-center justify-between flex-wrap gap-2">
 <CardTitle className="text-base">
 Postings
 {selectedCode && (
 <Badge variant="secondary" className="ml-2 text-xs">Account: {selectedCode}</Badge>
 )}
 </CardTitle>
 <div className="flex items-center gap-2">
 <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
 <input
 type="date"
 value={fromDate}
 onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
 className="h-7 rounded border border-input bg-background px-1.5 text-xs w-28"
 />
 <span className="text-xs text-muted-foreground">to</span>
 <input
 type="date"
 value={toDate}
 onChange={(e) => { setToDate(e.target.value); setPage(0); }}
 className="h-7 rounded border border-input bg-background px-1.5 text-xs w-28"
 />
 </div>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 <DataTable
 columns={columns}
 data={postings.content}
 />
 {postings.totalPages > 1 && (
 <div className="flex items-center justify-between px-4 pb-4 pt-2">
 <p className="text-xs text-muted-foreground">
 Page {postings.number + 1} of {postings.totalPages} ({postings.totalElements} total)
 </p>
 <div className="flex gap-2">
 <Button variant="outline" size="sm" disabled={postings.first} onClick={() => setPage((p) => Math.max(0, p - 1))}>
 Previous
 </Button>
 <Button variant="outline" size="sm" disabled={postings.last} onClick={() => setPage((p) => p + 1)}>
 Next
 </Button>
 </div>
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 </div>
 );
}