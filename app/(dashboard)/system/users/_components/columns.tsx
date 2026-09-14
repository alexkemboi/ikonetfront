"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ApiRoleUser } from "@/lib/types/roles";
import { DataTableColumnHeader } from "@/components/shared/column-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, MoreHorizontal, XCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/store/hooks";
import { setEditUserSheetOpen } from "@/store/slices/systemslice";

export function useStaffUserColumns(): ColumnDef<ApiRoleUser>[] {
  const dispatch = useAppDispatch();
  return [
  {
    accessorKey: "fullName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const user = row.original;
      const initials = [user.fname, user.otherName || user.middleName]
        .filter(Boolean)
        .map((n) => n[0].toUpperCase())
        .join("");

 return (
 <div className="flex items-center gap-3 min-w-0">
 <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
 <span className="text-xs font-semibold text-primary">{initials || "?"}</span>
 </div>
 <div className="min-w-0">
 <p className="text-sm font-medium text-foreground truncate">{user.fullName}</p>
 <p className="text-[11px] text-muted-foreground font-sans tabular-nums truncate">{user.username}</p>
 </div>
 </div>
 );
 },
 },
 {
 accessorKey: "email",
 header: ({ column }) => (
 <DataTableColumnHeader column={column} title="Email" />
 ),
 cell: ({ row }) => {
 return(
 <span className = "text-sm text-muted-foreground" > {row.getValue("email") }</span>
 )
 }
 },
 {
 accessorKey: "phoneNumber",
 header: ({ column }) => (
 <DataTableColumnHeader column={column} title="Phone" />
 ),
 cell: ({ row }) => (
 <span className="text-sm font-sans tabular-nums">{row.getValue("phoneNumber")}</span>
 ),
 },
 {
 accessorKey: "roleName",
 header: ({ column }) => (
 <DataTableColumnHeader column={column} title="Role" />
 ),
 cell: ({ row }) => {
 const role: string = row.getValue("roleName");
 return (
 <Badge variant="outline" className="text-[11px] font-medium capitalize bg-primary/5 text-primary border-primary/20">
 {role}
 </Badge>
 );
 },
 },
 {
 accessorKey: "isactive",
 header: ({ column }) => (
 <DataTableColumnHeader column={column} title="Status" />
 ),
 cell: ({ row }) => {
 const active: boolean = row.getValue("isactive");
 return (
 <div className={cn(
 "inline-flex items-center gap-1.5 text-xs font-medium",
 active ? "text-success" : "text-muted-foreground"
 )}>
 {active
 ? <><CheckCircle2 className="w-3.5 h-3.5" /> Active</>
 : <><XCircle className="w-3.5 h-3.5" /> Inactive</>}
 </div>
 );
 },
 },
 {
 accessorKey: "canLogin",
 header: ({ column }) => (
 <DataTableColumnHeader column={column} title="Login" />
 ),
 cell: ({ row }) => {
 const canLogin: boolean = row.getValue("canLogin");
 return (
 <Badge
 variant="outline"
 className={cn(
 "text-[11px]",
 canLogin
 ? "bg-success/10 text-success border-success/20"
 : "bg-muted text-muted-foreground border-border"
 )}
 >
 {canLogin ? "Enabled" : "Disabled"}
 </Badge>
 );
 },
 },
 {
 accessorKey: "createdAt",
 header: ({ column }) => (
 <DataTableColumnHeader column={column} title="Created" />
 ),
 cell: ({ row }) => {
 const raw: string = row.getValue("createdAt");
 const date = raw
 ? new Date(raw).toLocaleDateString("en-KE", {
 day: "2-digit",
 month: "short",
 year: "numeric",
 })
 : "—";
 return <span className="text-xs text-muted-foreground tabular-nums">{date}</span>;
 },
 },

  {
    id: "actions",
cell: () => {

 return (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="h-8 w-8 p-0">
 <span className="sr-only">Open menu</span>
 <MoreHorizontal className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuLabel>Actions</DropdownMenuLabel>
 <DropdownMenuItem
 // onClick={() => navigator.clipboard.writeText(payment.id)}
 onClick={() => dispatch(setEditUserSheetOpen(true))}
 >
 Edit user
 </DropdownMenuItem>
 
 </DropdownMenuContent>
 </DropdownMenu>
 )
 },
 },
];
}
