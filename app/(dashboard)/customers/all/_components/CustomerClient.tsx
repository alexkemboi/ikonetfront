"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Customer } from "@/lib/types/customer";
import { deleteCustomer, toggleCustomerActiveStatus } from "@/actions/customer";
import { useAppDispatch } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { RenewSubscriptionSheet } from "../../_components/RenewSubscriptionSheet";
import { ChangePasswordSheet } from "../../_components/ChangePasswordSheet";
import { createCustomerColumns } from "./columns";
import { usePermissions } from "@/providers/PermissionsProvider";

interface CustomerClientProps {
  initialCustomers: Customer[];
}

export function CustomerClient({ initialCustomers }: CustomerClientProps) {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const perms    = usePermissions("/customers");

  async function handleToggleActive(customer: Customer) {
    toast.loading(`Updating ${customer.fullName}…`);
    try {
      const result = await toggleCustomerActiveStatus(customer.userIdxno);
      toast.dismiss();
      result.success
        ? toast.success(result.message || "Status updated.")
        : toast.error(result.message || "Failed to update status.");
    } catch {
      toast.dismiss();
      toast.error("Failed to update status.");
    }
  }

  async function handleDelete(customer: Customer) {
    toast.loading(`Deleting ${customer.fullName}…`);
    try {
      const result = await deleteCustomer(customer.userIdxno);
      toast.dismiss();
      result.success
        ? toast.success(result.message || "Customer deleted.")
        : toast.error(result.message || "Failed to delete.");
    } catch {
      toast.dismiss();
      toast.error("Failed to delete customer.");
    }
  }

  const columns = useMemo(
    () => createCustomerColumns(router, dispatch, handleToggleActive, handleDelete),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, dispatch]
  );

  const activeCount  = initialCustomers.filter((c) => c.isActive).length;
  const pppoeCount   = initialCustomers.filter((c) => c.custtype === "pppoe").length;
  const hotspotCount = initialCustomers.filter((c) => c.custtype === "hotspot").length;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">All Customers</h1>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <p className="text-sm text-muted-foreground">
                {initialCustomers.length} total
              </p>
              <Badge variant="outline" className="text-[11px] bg-success/10 text-success border-success/20">
                {activeCount} active
              </Badge>
              <Badge variant="outline" className="text-[11px] bg-primary/10 text-primary border-primary/20">
                {pppoeCount} PPPoE
              </Badge>
              <Badge variant="outline" className="text-[11px] bg-warning/10 text-warning border-warning/20">
                {hotspotCount} Hotspot
              </Badge>
            </div>
          </div>
          {perms.canCreate && (
            <Button onClick={() => router.push("/customers/new")} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /> Add Customer
            </Button>
          )}
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={initialCustomers}
          searchPlaceholder="Search by name, email, username, package…"
        />
      </div>

      <RenewSubscriptionSheet customers={initialCustomers} />
      <ChangePasswordSheet customers={initialCustomers} />
    </>
  );
}
