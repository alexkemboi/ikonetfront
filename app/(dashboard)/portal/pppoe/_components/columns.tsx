"use client";

import { ColumnDef } from "@tanstack/react-table";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { MoreHorizontal, RefreshCw, KeyRound, UserCheck, UserX, Eye, PackageCheck, Smartphone } from "lucide-react";
import { Customer } from "@/lib/types/customer";
import type { PppoeServiceRequest } from "./PppoeServiceDialog";
import { AppDispatch } from "@/store";
import { openRenewSheet, openPasswordSheet } from "@/store/slices/customerslice";
import { DataTableColumnHeader } from "@/components/shared/column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
 resolveExpiryDateColorClass,
 formatCustomerDate,
} from "@/lib/utils/customerFormatters";
import { cn } from "@/lib/utils";

export function createPPPoEColumns(
 router: AppRouterInstance,
 dispatch: AppDispatch,
 onToggleActive: (customer: Customer) => void,
 onService: (request: PppoeServiceRequest) => void
): ColumnDef<Customer>[] {
 return [
 {
 accessorKey: "fullName",
 header: ({ column }) => (
 <DataTableColumnHeader column={column} title="Customer" />
 ),
 cell: ({ row }) => {
 const c = row.original;
 const initials = [c.firstname, c.lname]
 .filter(Boolean)
 .map((n) => n[0].toUpperCase())
 .join("");
 return (
 <div className="flex items-center gap-3 min-w-0">
 <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
 <span className="text-xs font-semibold text-primary">{initials || "?"}</span>
 </div>
 <div className="min-w-0">
 <p className="text-sm font-medium text-foreground truncate">{c.fullName}</p>
 <p className="text-[11px] text-muted-foreground font-sans tabular-nums truncate">{c.username}</p>
 </div>
 </div>
 );
 },
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
 accessorKey: "packageName",
 header: ({ column }) => (
 <DataTableColumnHeader column={column} title="Package" />
 ),
 cell: ({ row }) => {
 const pkg: string | null = row.getValue("packageName");
 return (
 <span className={cn("text-sm", !pkg && "text-muted-foreground italic")}>
 {pkg || "No package"}
 </span>
 );
 },
 },
 {
 accessorKey: "expiryDate",
 header: ({ column }) => (
 <DataTableColumnHeader column={column} title="Expiry" />
 ),
 cell: ({ row }) => {
 const date: string | null = row.getValue("expiryDate");
 return (
 <span className={cn("text-sm font-medium tabular-nums", resolveExpiryDateColorClass(date))}>
 {formatCustomerDate(date)}
 </span>
 );
 },
 },
 {
 accessorKey: "isSubActive",
 header: ({ column }) => (
 <DataTableColumnHeader column={column} title="Subscription" />
 ),
 cell: ({ row }) => {
 const val: boolean | null = row.getValue("isSubActive");
 if (val === null || val === undefined)
 return <Badge variant="outline" className="text-[11px]">N/A</Badge>;
 return (
 <Badge
 variant="outline"
 className={cn("text-[11px]", val
 ? "bg-success/10 text-success border-success/20"
 : "bg-destructive/10 text-destructive border-destructive/20"
 )}
 >
 {val ? "Active" : "Inactive"}
 </Badge>
 );
 },
 },
 {
 accessorKey: "isActive",
 header: ({ column }) => (
 <DataTableColumnHeader column={column} title="Account" />
 ),
 cell: ({ row }) => {
 const active: boolean = row.getValue("isActive");
 return (
 <Badge
 variant="outline"
 className={cn("text-[11px]", active
 ? "bg-primary/10 text-primary border-primary/20"
 : "bg-muted text-muted-foreground border-border"
 )}
 >
 {active ? "Active" : "Inactive"}
 </Badge>
 );
 },
 },
 {
 id: "actions",
 enableHiding: false,
 cell: ({ row }) => {
 const customer = row.original;
 return (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="h-8 w-8 p-0">
 <span className="sr-only">Open menu</span>
 <MoreHorizontal className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-48">
 <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
 Actions
 </DropdownMenuLabel>
 <DropdownMenuItem
 className="gap-2 cursor-pointer"
 onClick={() => router.push(`/customers/${customer.userIdxno}`)}
 >
 <Eye className="w-3.5 h-3.5" /> View Profile
 </DropdownMenuItem>
 <DropdownMenuItem
 className="gap-2 cursor-pointer"
 onClick={() => onToggleActive(customer)}
 >
 {customer.isActive
 ? <><UserX className="w-3.5 h-3.5" /> Deactivate</>
 : <><UserCheck className="w-3.5 h-3.5" /> Activate</>}
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 {/* Customers with a PPPoE account are managed through packages and payments. */}
 {customer.customerId && (
 <>
 <DropdownMenuItem
 className="gap-2 cursor-pointer"
 onClick={() => onService({ kind: "package", customer })}
 >
 <PackageCheck className="w-3.5 h-3.5" /> Assign package
 </DropdownMenuItem>
 <DropdownMenuItem
 className="gap-2 cursor-pointer"
 onClick={() => onService({ kind: "payment", customer })}
 >
 <Smartphone className="w-3.5 h-3.5" /> Request M-Pesa payment
 </DropdownMenuItem>
 </>
 )}
 <DropdownMenuItem
 className="gap-2 cursor-pointer"
 onClick={() => dispatch(openRenewSheet(customer.userIdxno))}
 >
 <RefreshCw className="w-3.5 h-3.5" /> {customer.customerId ? "Renew one period (paid offline)" : "Renew Subscription"}
 </DropdownMenuItem>
 <DropdownMenuItem
 className="gap-2 cursor-pointer"
 onClick={() => dispatch(openPasswordSheet(customer.userIdxno))}
 >
 <KeyRound className="w-3.5 h-3.5" /> Change Password
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 );
 },
 },
 ];
}
