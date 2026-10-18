"use client";

import { useEffect, useRef, useState } from "react";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
 Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/shared/data-table";
import { auditColumns, METHOD_STYLES } from "./columns";
import { getAuditLogPage, type AuditLogPage } from "@/actions/audit";

interface Props {
 /** The first page, loaded on the server */
 initial: AuditLogPage;
 /** The platform log (SYSADMIN) instead of the company log */
 platform: boolean;
 title?: string;
 /** Which log this is (company events or platform events). */
 subtitle?: string;
}

/**
 * One page of the audit log at a time. Search, filters and paging are applied by the server, so
 * the page no longer loads the whole log (the platform log had 48 818 rows on 17 Oct).
 */
export default function AuditLogsClient({ initial, platform, title = "Audit Logs", subtitle }: Props) {
 const [data, setData] = useState<AuditLogPage>(initial);
 const [method, setMethod] = useState("ALL");
 const [module, setModule] = useState("ALL");
 const [search, setSearch] = useState("");
 const [pageIndex, setPageIndex] = useState(0);
 const [pageSize, setPageSize] = useState(initial.size);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const first = useRef(true);

 useEffect(() => {
 if (first.current) {
 first.current = false;
 return;
 }
 let cancelled = false;
 // typing waits a moment before asking the server; other changes go at once
 const timer = setTimeout(async () => {
 setLoading(true);
 const res = await getAuditLogPage({
 platform, page: pageIndex, size: pageSize, search,
 module: module === "ALL" ? undefined : module,
 action: method === "ALL" ? undefined : method,
 });
 if (cancelled) return;
 setLoading(false);
 setError(res.error ?? "");
 if (res.data) setData(res.data);
 }, 300);
 return () => {
 cancelled = true;
 clearTimeout(timer);
 };
 }, [platform, pageIndex, pageSize, search, module, method]);

 const methods = data.actions;
 const modules = data.modules;
 const choose = (set: (v: string) => void) => (value: string) => {
 set(value);
 setPageIndex(0);
 };
 const chooseMethod = choose(setMethod);
 const chooseModule = choose(setModule);

 // Filter controls passed into DataTable's toolbar slot.
 // They sit to the right of the built-in search bar.
 const toolbar = (
 <div className="flex items-center gap-2 flex-wrap">
 {/* HTTP method chips */}
 <div className="flex items-center gap-1">
 <button
 onClick={() => chooseMethod("ALL")}
 className={cn(
 "h-7 px-2.5 rounded-full text-[11px] font-semibold border transition-colors",
 method === "ALL"
 ? "bg-foreground text-background border-foreground"
 : "bg-card text-muted-foreground border-border hover:border-foreground/40"
 )}
 >
 All
 </button>
 {methods.map((m) => (
 <button
 key={m}
 onClick={() => chooseMethod(m)}
 className={cn(
 "h-7 px-2.5 rounded-full text-[11px] font-semibold border transition-colors",
 method === m
 ? cn(METHOD_STYLES[m], "border-current!")
 : "bg-card text-muted-foreground border-border hover:border-foreground/40"
 )}
 >
 {m}
 </button>
 ))}
 </div>

 {/* Module dropdown */}
 <Select value={module} onValueChange={chooseModule}>
 <SelectTrigger className="h-7 w-40 text-xs">
 <SelectValue placeholder="All modules" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="ALL">All modules</SelectItem>
 {modules.map((m) => (
 <SelectItem key={m} value={m}>{m}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 );

 return (
 <div className="space-y-5">
 {/* Page header */}
 <div className="flex items-start justify-between">
 <div>
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
 <Activity className="w-4.5 h-4.5 text-primary" />
 </div>
 <h1 className="text-2xl font-normal tracking-normal text-foreground">{title}</h1>
 </div>
 <p className="text-sm text-muted-foreground mt-1 ml-0.5">
 {subtitle && <>{subtitle} &middot; </>}
 {data.totalElements.toLocaleString()} {method !== "ALL" || module !== "ALL" || search.trim() ? "matching events" : "total events"}
 </p>
 </div>

 {/* Active filter summary badges */}
 <div className="flex items-center gap-1.5 mt-1">
 {method !== "ALL" && (
 <Badge
 variant="outline"
 className={cn("text-[10px] px-2 cursor-pointer", METHOD_STYLES[method])}
 onClick={() => chooseMethod("ALL")}
 >
 {method} ×
 </Badge>
 )}
 {module !== "ALL" && (
 <Badge
 variant="outline"
 className="text-[10px] px-2 cursor-pointer"
 onClick={() => chooseModule("ALL")}
 >
 {module} ×
 </Badge>
 )}
 </div>
 </div>

 {/* Global DataTable — search + pagination built in, filters in toolbar */}
 {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
 <DataTable
 columns={auditColumns}
 data={data.content}
 searchPlaceholder="Search user, module, description, endpoint…"
 toolbar={toolbar}
 manualPagination
 manualFiltering
 pageIndex={pageIndex}
 pageSize={pageSize}
 totalRows={data.totalElements}
 pageCount={Math.max(1, Math.ceil(data.totalElements / pageSize))}
 onPaginationChange={(index, size) => {
 setPageIndex(size !== pageSize ? 0 : index);
 setPageSize(size);
 }}
 searchValue={search}
 onSearchChange={(value) => {
 setSearch(value);
 setPageIndex(0);
 }}
 loading={loading}
 />
 </div>
 );
}
