"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MoreHorizontal, ArrowUpDown, Plus } from "lucide-react";
import { toast } from "sonner";

import { Customer } from "@/lib/types/customer";
import { toggleCustomerActiveStatus } from "@/actions/customer";
import { useAppDispatch } from "@/store/hooks";
import { openRenewSheet, openPasswordSheet } from "@/store/slices/customerslice";
import {
  resolveExpiryDateColorClass,
  formatCustomerDate,
} from "@/lib/utils/customerFormatters";
import { RenewSubscriptionSheet } from "../../_components/RenewSubscriptionSheet";
import { ChangePasswordSheet } from "../../_components/ChangePasswordSheet";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PPPoECustomerTableProps {
  customers: Customer[];
}

export function PPPoECustomerTable({ customers }: PPPoECustomerTableProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  async function handleToggleActiveStatus(customer: Customer) {
    toast.loading(`Updating status for ${customer.fullName}...`);
    try {
      const result = await toggleCustomerActiveStatus(customer.userIdxno);
      toast.dismiss();
      if (result.success) {
        toast.success(result.message || "Status updated.");
      } else {
        toast.error(result.message || "Failed to update status.");
      }
    } catch {
      toast.dismiss();
      toast.error("Failed to update status.");
    }
  }

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "username",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Username
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">
          {row.getValue("username")}
        </span>
      ),
    },
    {
      accessorKey: "fullName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Full Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone",
    },
    {
      accessorKey: "packageName",
      header: "Package",
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("packageName") || "N/A"}</span>
      ),
    },
    {
      accessorKey: "isSubActive",
      header: "Subscription",
      cell: ({ row }) => {
        const isSubActive = row.getValue("isSubActive");
        if (isSubActive === null || isSubActive === undefined) {
          return <Badge variant="outline">N/A</Badge>;
        }
        return isSubActive ? (
          <Badge className="bg-[var(--success)] text-white">Active</Badge>
        ) : (
          <Badge variant="destructive">Inactive</Badge>
        );
      },
    },
    {
      accessorKey: "expiryDate",
      header: "Expiry Date",
      cell: ({ row }) => {
        const expiryDate = row.getValue("expiryDate") as string | null;
        return (
          <span
            className={`text-sm font-medium ${resolveExpiryDateColorClass(expiryDate)}`}
          >
            {formatCustomerDate(expiryDate)}
          </span>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Account",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge
            className={isActive ? "bg-primary text-white" : ""}
            variant={isActive ? "default" : "destructive"}
          >
            {isActive ? "Active" : "Inactive"}
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
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/customers/${customer.userIdxno}`)
                }
              >
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleToggleActiveStatus(customer)}
              >
                {customer.isActive ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => dispatch(openRenewSheet(customer.userIdxno))}
              >
                Renew Subscription
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => dispatch(openPasswordSheet(customer.userIdxno))}
              >
                Change Password
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl font-bold">
                PPPoE Customers
              </CardTitle>
              <Badge variant="secondary">{customers.length}</Badge>
            </div>
            <Button onClick={() => router.push("/customers/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={customers}
              filterColumnId="username"
            />
          </CardContent>
        </Card>
      </motion.div>

      <RenewSubscriptionSheet customers={customers} />
      <ChangePasswordSheet customers={customers} />
    </>
  );
}
