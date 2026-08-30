"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wifi } from "lucide-react";
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

interface PPPoECustomerTableProps {
 customers: Customer[];
}

export function PPPoECustomerTable({ customers }: PPPoECustomerTableProps) {
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
 <div className="flex items-start justify-between gap-4">
 <div>
 <div className="flex items-center gap-2">
 <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
 <Wifi className="w-4 h-4 text-primary" />
 </div>
 <h1 className="text-2xl font-bold tracking-tight">PPPoE Clients</h1>
 </div>
 <div className="flex items-center gap-3 mt-1">
 <p className="text-sm text-muted-foreground">
 {customers.length} {customers.length === 1 ? "client" : "clients"}
 </p>
 <Badge variant="outline" className="text-[11px] bg-success/10 text-success border-success/20">
 {subActive} subscribed
 </Badge>
 <Badge variant="outline" className="text-[11px] bg-primary/10 text-primary border-primary/20">
 {activeCount} active
 </Badge>
 </div>
 </div>
 {perms.canCreate && (
 <Button onClick={() => router.push("/customers/new")} className="gap-2 shrink-0">
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
