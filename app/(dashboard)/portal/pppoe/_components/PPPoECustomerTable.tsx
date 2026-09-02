"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Package } from "lucide-react";
import { toast } from "sonner";
import { Customer } from "@/lib/types/customer";
import { toggleCustomerActiveStatus } from "@/actions/customer";
import { useAppDispatch } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/providers/PermissionsProvider";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { RenewSubscriptionSheet } from "@/app/(dashboard)/customers/_components/RenewSubscriptionSheet";
import { ChangePasswordSheet } from "@/app/(dashboard)/customers/_components/ChangePasswordSheet";
import { createPPPoEColumns } from "./columns";
import type { PppoePackageResponse } from "@/lib/types/pppoe";

interface PPPoECustomerTableProps {
 customers: Customer[];
 /** Live PPPoE packages (GET /pppoe/packages) — surfaced as a summary. */
 packages?: PppoePackageResponse[];
}

export function PPPoECustomerTable({ customers, packages = [] }: PPPoECustomerTableProps) {
 const dispatch = useAppDispatch();
 const router = useRouter();
 const perms = usePermissions("/portal/pppoe");

 async function handleToggleActive(customer: Customer) {
 toast.loading(`Updating ${customer.fullName}…`);
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

const columns = useMemo(
  () => createPPPoEColumns(router, dispatch, handleToggleActive),
  [router, dispatch]
  );

 const activeCount = customers.filter((c) => c.isActive).length;
 const subActive = customers.filter((c) => c.isSubActive).length;

 return (
 <>
 <div className="space-y-6">
{/* Header */}
  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <p className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
        Portal — PPPoE Clients
      </p>
      <h1 className="text-3xl font-serif font-semibold text-foreground">PPPoE Clients.</h1>
      <div className="mt-1 flex items-center gap-3">
        <p className="text-xs text-muted-foreground">
          {customers.length} {customers.length === 1 ? "client" : "clients"}
        </p>
        <Badge variant="outline" className="text-[11px] bg-success/10 text-success border-success/20">
          {subActive} subscribed
        </Badge>
        <Badge variant="outline" className="text-[11px] bg-primary/10 text-primary border-primary/20">
          {activeCount} active
        </Badge>
        {packages.length > 0 && (
          <Badge variant="outline" className="text-[11px] gap-1 bg-muted text-muted-foreground border-border">
            <Package className="h-3 w-3" />
            {packages.length} {packages.length === 1 ? "package" : "packages"}
          </Badge>
        )}
      </div>
    </div>
    {perms.canCreate && (
      <Button
        onClick={() => router.push("/customers/new")}
        className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-semibold text-black hover:bg-amber-400 transition shadow-lg shadow-amber-500/20 shrink-0"
      >
        <Plus className="h-4 w-4" /> Add Client
      </Button>
    )}
  </div>

 {/* Table */}
 <DataTable
 columns={columns}
 data={customers}
 searchPlaceholder="Search by name, username, package…"
 />
 </div>

 <RenewSubscriptionSheet customers={customers} />
 <ChangePasswordSheet customers={customers} />
 </>
 );
}