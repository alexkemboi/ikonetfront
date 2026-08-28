"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/shared/column-header";
import { cn } from "@/lib/utils";
import type { AuditLog } from "@/actions/audit";

export const METHOD_STYLES: Record<string, string> = {
 GET: "bg-primary/10 text-primary border-primary/20",
 POST: "bg-success/10 text-success border-success/20",
 PATCH: "bg-warning/10 text-warning border-warning/20",
 PUT: "bg-warning/10 text-warning border-warning/20",
 DELETE: "bg-danger/10 text-danger border-danger/20",
};

function formatDate(iso: string) {
 const d = new Date(iso);
 return {
 date: d.toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" }),
 time: d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
 };
}

export const auditColumns: ColumnDef<AuditLog>[] = [
 {
 accessorKey: "accessTime",
 header: ({ column }) => <DataTableColumnHeader column={column} title="Time" />,
 cell: ({ row }) => {
 const { date, time } = formatDate(row.getValue("accessTime"));
 return (
 <div className="flex flex-col min-w-0">
 <span className="text-xs font-medium text-foreground whitespace-nowrap">{date}</span>
 <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1 mt-0.5">
 <Clock className="w-2.5 h-2.5 shrink-0" />
 {time}
 </span>
 </div>
 );
 },
 sortingFn: "datetime",
 },
 {
 accessorKey: "username",
 header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
 cell: ({ row }) => (
 <span className="text-xs font-medium text-foreground" title={row.getValue("username")}>
 {row.getValue("username")}
 </span>
 ),
 },
 {
 accessorKey: "action",
 header: ({ column }) => <DataTableColumnHeader column={column} title="Method" />,
 cell: ({ row }) => {
 const method: string = row.getValue("action");
 return (
 <Badge
 variant="outline"
 className={cn(
 "text-[10px] px-1.5 py-0 font-semibold uppercase tracking-wide",
 METHOD_STYLES[method] ?? "bg-muted text-muted-foreground border-border"
 )}
 >
 {method}
 </Badge>
 );
 },
 },
 {
 accessorKey: "subModule",
 header: ({ column }) => <DataTableColumnHeader column={column} title="Sub-Module" />,
 cell: ({ row }) => (
 <div className="min-w-0">
 <p className="text-xs font-medium text-foreground truncate">{row.getValue("subModule")}</p>
 <p className="text-[11px] text-muted-foreground truncate">{row.original.module}</p>
 </div>
 ),
 },
 {
 accessorKey: "actionDescription",
 header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
 cell: ({ row }) => (
 <span
 className="text-xs text-muted-foreground truncate block max-w-xs"
 title={row.getValue("actionDescription")}
 >
 {row.getValue("actionDescription")}
 </span>
 ),
 },
 {
 accessorKey: "accessTo",
 header: ({ column }) => <DataTableColumnHeader column={column} title="Endpoint" />,
 cell: ({ row }) => (
 <span
 className="font-mono text-[11px] text-muted-foreground truncate block max-w-[160px]"
 title={row.getValue("accessTo")}
 >
 {row.getValue("accessTo")}
 </span>
 ),
 },
];
