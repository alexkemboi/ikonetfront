"use client";

import { ColumnDef } from "@tanstack/react-table";
import { deleteCustomer, toggleCustomerActiveStatus } from "@/actions/customer";
import { useRouter } from "next/navigation";
import { Customer } from "@/lib/types/customer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useAppDispatch } from "@/store/hooks";
import { openRenewSheet, openPasswordSheet } from "@/store/slices/customerslice";
import { RenewSubscriptionSheet } from "../../_components/RenewSubscriptionSheet";
import { ChangePasswordSheet } from "../../_components/ChangePasswordSheet";
import { resolveExpiryDateColorClass, formatCustomerDate } from "@/lib/utils/customerFormatters";

interface CustomerClientProps {
  initialCustomers: Customer[];
}

export function CustomerClient({ initialCustomers }: CustomerClientProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  function navigateToCustomerDetail(customer: Customer) {
    router.push(`/customers/${customer.userIdxno}`);
  }

  async function handleToggleCustomerActiveStatus(customer: Customer) {
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

  async function handleDeleteCustomer(customer: Customer) {
    toast.loading(`Deleting ${customer.fullName}...`);
    try {
      const result = await deleteCustomer(customer.userIdxno);
      toast.dismiss();
      if (result.success) {
        toast.success(result.message || "Customer deleted.");
      } else {
        toast.error(result.message || "Failed to delete customer.");
      }
    } catch {
      toast.dismiss();
      toast.error("Failed to delete customer.");
    }
  }

  const columns: ColumnDef<Customer>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
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
        <span className="font-mono text-sm">{row.getValue("username")}</span>
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
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone",
    },
    {
      accessorKey: "custtype",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.getValue("custtype") || "N/A"}
        </Badge>
      ),
    },
    {
      accessorKey: "packageName",
      header: "Package",
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("packageName") || "N/A"}</span>
      ),
    },
    {
      accessorKey: "expiryDate",
      header: "Expiry",
      cell: ({ row }) => {
        const expiryDate = row.getValue("expiryDate") as string | null;
        return (
          <span className={`text-sm font-medium ${resolveExpiryDateColorClass(expiryDate)}`}>
            {formatCustomerDate(expiryDate)}
          </span>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
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
              <DropdownMenuItem onClick={() => navigateToCustomerDetail(customer)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleToggleCustomerActiveStatus(customer)}
              >
                {customer.isActive ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteCustomer(customer)}
              >
                Delete Customer
              </DropdownMenuItem>
              {customer.custtype === "pppoe" && (
                <>
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
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold">All Customers</CardTitle>
            <Button onClick={() => router.push("/customers/new")}>
              Add Customer
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={initialCustomers}
              filterColumnId="username"
            />
          </CardContent>
        </Card>
      </motion.div>

      <RenewSubscriptionSheet customers={initialCustomers} />
      <ChangePasswordSheet customers={initialCustomers} />
    </>
  );
}
