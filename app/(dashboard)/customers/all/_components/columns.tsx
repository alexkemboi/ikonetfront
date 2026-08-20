"use client";

import { ColumnDef } from "@tanstack/react-table";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  MoreHorizontal, Eye, UserCheck, UserX,
  Trash2, RefreshCw, KeyRound,
} from "lucide-react";
import { Customer } from "@/lib/types/customer";
import { AppDispatch } from "@/store";
import { openRenewSheet, openPasswordSheet } from "@/store/slices/customerslice";
import { DataTableColumnHeader } from "@/components/shared/column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { getEffectiveSubscriberStatus } from "@/lib/utils/subscriberStatus";
import { cn } from "@/lib/utils";

export function createCustomerColumns(
  router: AppRouterInstance,
  dispatch: AppDispatch,
  onToggleActive: (customer: Customer) => void,
  onDelete: (customer: Customer) => void
): ColumnDef<Customer>[] {
  return [
    {
      id: "select",
      enableSorting: false,
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
    },
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
              <p className="text-[11px] text-muted-foreground font-mono truncate">{c.username}</p>
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
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.getValue("email")}</span>
      ),
    },
    {
      accessorKey: "phoneNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-mono">{row.getValue("phoneNumber")}</span>
      ),
    },
    {
      accessorKey: "custtype",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type: string | null = row.getValue("custtype");
        return (
          <Badge
            variant="outline"
            className={cn(
              "text-[11px] capitalize",
              type === "pppoe"
                ? "bg-primary/10 text-primary border-primary/20"
                : type === "hotspot"
                ? "bg-warning/10 text-warning border-warning/20"
                : "bg-muted text-muted-foreground border-border"
            )}
          >
            {type ?? "N/A"}
          </Badge>
        );
      },
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
            {pkg ?? "No package"}
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
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const active: boolean = row.getValue("isActive");
        const expiry: string | null = row.getValue("expiryDate");
        const effective = getEffectiveSubscriberStatus(
          expiry,
          active ? "Active" : "Inactive"
        );
        return (
          <Badge
            variant="outline"
            className={cn("text-[11px]", effective.badgeClass)}
          >
            {effective.label}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const customer = row.original;
        const isPPPoE  = customer.custtype === "pppoe";
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
                <Eye className="w-3.5 h-3.5" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => onToggleActive(customer)}
              >
                {customer.isActive
                  ? <><UserX className="w-3.5 h-3.5" /> Deactivate</>
                  : <><UserCheck className="w-3.5 h-3.5" /> Activate</>}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                onClick={() => onDelete(customer)}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Customer
              </DropdownMenuItem>
              {isPPPoE && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() => dispatch(openRenewSheet(customer.userIdxno))}
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Renew Subscription
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() => dispatch(openPasswordSheet(customer.userIdxno))}
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Change Password
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
