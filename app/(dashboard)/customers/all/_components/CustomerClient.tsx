"use client";

import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { deleteCustomer, updateCustomer } from "@/actions/customer";
import { useRouter } from "next/navigation";
import {
  Customer,
  UpdateCustomerPayload,
} from "@/lib/types/customer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface CustomerClientProps {
  initialCustomers: Customer[];
}

export function CustomerClient({ initialCustomers }: CustomerClientProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const router = useRouter();

  // Placeholder action handlers
  const handleViewDetails = (customer: Customer) => {
    router.push(`/customers/${customer.userIdxno}`);
  };

  const handleEditCustomer = (customer: Customer) => {
    toast.info(`Editing ${customer.fullName}`);
    console.log("Edit Customer:", customer);
    // Implement dialog or navigation for editing
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    try {
      toast.loading(`Deleting ${customer.fullName}...`);
      const response = await deleteCustomer(customer.userIdxno);
      toast.dismiss();
      if (response.success) {
        setCustomers((prev) =>
          prev.filter((cust) => cust.userIdxno !== customer.userIdxno)
        );
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to delete customer.");
      console.error("Delete Customer Error:", error);
    }
  };

  const handleToggleActive = async (customer: Customer) => {
    try {
      toast.loading(`Toggling active status for ${customer.fullName}...`);
      const updatedStatus = !customer.isActive;
      const payload: UpdateCustomerPayload = { isActive: updatedStatus };
      const response = await updateCustomer(
        customer.userIdxno,
        payload
      );
      toast.dismiss();
      if (response.success) {
        setCustomers((prev) =>
          prev.map((cust) =>
            cust.userIdxno === customer.userIdxno
              ? { ...cust, isActive: updatedStatus }
              : cust
          )
        );
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to toggle active status.");
      console.error("Toggle Active Error:", error);
    }
  };

  const handleRenewSubscription = (customer: Customer) => {
    toast.info(`Renewing subscription for ${customer.fullName}`);
    console.log("Renew Subscription:", customer);
    // Implement renew subscription dialog/API call
  };

  const handleChangePppoePassword = (customer: Customer) => {
    toast.info(`Changing PPPoE password for ${customer.fullName}`);
    console.log("Change PPPoE Password:", customer);
    // Implement change password dialog/API call
  };

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
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Username
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="lowercase">{row.getValue("username")}</div>,
    },
    {
      accessorKey: "fullName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Full Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone Number",
    },
    {
      accessorKey: "isActive",
      header: "Active",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive");
        return (
          <Badge variant={isActive ? "default" : "destructive"}>
            {isActive ? "Yes" : "No"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "custtype",
      header: "Customer Type",
      cell: ({ row }) => <div>{row.getValue("custtype") || "N/A"}</div>,
    },
    {
      accessorKey: "packageName",
      header: "Package",
      cell: ({ row }) => <div>{row.getValue("packageName") || "N/A"}</div>,
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return <div>{date.toLocaleDateString()}</div>;
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
              <DropdownMenuItem onClick={() => handleViewDetails(customer)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                Edit Customer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteCustomer(customer)}>
                Delete Customer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleToggleActive(customer)}>
                Toggle Active Status
              </DropdownMenuItem>
              {customer.custtype === "pppoe" && (
                <>
                  <DropdownMenuItem onClick={() => handleRenewSubscription(customer)}>
                    Renew Subscription
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleChangePppoePassword(customer)}>
                    Change PPPoE Password
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
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-2xl font-bold">
            All Customers
        </CardTitle>
        <CardTitle className="text-2xl font-bold">
          <Button className="hover:cursor-pointer hover:bg-chart-3 hover:text-white transition-all duration-150" onClick={() => router.push("/customers/new")}>Add Customer</Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={customers} filterColumnId="username" />
      </CardContent>
    </Card>
  );
}
