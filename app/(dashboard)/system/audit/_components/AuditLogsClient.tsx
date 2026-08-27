"use client";

import { useState, useMemo } from "react";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
 Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/shared/data-table";
import { auditColumns, METHOD_STYLES } from "./columns";
import type { AuditLog } from "@/actions/audit";

interface Props {
 logs: AuditLog[];
 /** Unique HTTP methods present in the data — derived server-side */
 methods: string[];
 /** Unique module names present in the data — derived server-side */
 modules: string[];
}

export default function AuditLogsClient({ logs, methods, modules }: Props) {
 const [method, setMethod] = useState("ALL");
 const [module, setModule] = useState("ALL");

 // Pre-filter by method + module before handing data to DataTable.
 // DataTable's built-in global filter then handles the text search on top.
 const filtered = useMemo(
 () =>
 logs.filter(
 (l) =>
 (method === "ALL" || l.action === method) &&
 (module === "ALL" || l.module === module)
 ),
 [logs, method, module]
 );

 // Filter controls passed into DataTable's toolbar slot.
 // They sit to the right of the built-in search bar.
 const toolbar = (
 <div className="flex items-center gap-2 flex-wrap">
 {/* HTTP method chips */}
 <div className="flex items-center gap-1">
 <button
 onClick={() => setMethod("ALL")}
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
 onClick={() => setMethod(m)}
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
 <Select value={module} onValueChange={setModule}>
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
 <h1 className="text-2xl font-bold tracking-tight text-foreground">Audit Logs</h1>
 </div>
 <p className="text-sm text-muted-foreground mt-1 ml-0.5">
 {logs.length.toLocaleString()} total events
 {filtered.length !== logs.length && (
 <> &middot; <span className="text-foreground font-medium">{filtered.length.toLocaleString()} shown</span></>
 )}
 </p>
 </div>

 {/* Active filter summary badges */}
 <div className="flex items-center gap-1.5 mt-1">
 {method !== "ALL" && (
 <Badge
 variant="outline"
 className={cn("text-[10px] px-2 cursor-pointer", METHOD_STYLES[method])}
 onClick={() => setMethod("ALL")}
 >
 {method} ×
 </Badge>
 )}
 {module !== "ALL" && (
 <Badge
 variant="outline"
 className="text-[10px] px-2 cursor-pointer"
 onClick={() => setModule("ALL")}
 >
 {module} ×
 </Badge>
 )}
 </div>
 </div>

 {/* Global DataTable — search + pagination built in, filters in toolbar */}
 <DataTable
 columns={auditColumns}
 data={filtered}
 searchPlaceholder="Search user, description, endpoint…"
 toolbar={toolbar}
 />
 </div>
 );
}
