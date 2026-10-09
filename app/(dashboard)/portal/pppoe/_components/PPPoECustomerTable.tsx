"use client";

import { PppoeServiceDialog, type PppoeServiceRequest } from "./PppoeServiceDialog";
import { useCompanyScope } from "@/providers/CompanyScopeProvider";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Boxes, Plus } from "lucide-react";
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
 /** A customer just created: their package dialog opens straight away. */
 assignUserIdxno?: number;
}

export function PPPoECustomerTable({ customers, assignUserIdxno }: PPPoECustomerTableProps) {
 const dispatch = useAppDispatch();
 const router = useRouter();
 const perms = usePermissions("/portal/pppoe");
 const { requireCompany } = useCompanyScope();
 const [serviceRequest, setServiceRequest] = useState<PppoeServiceRequest | null>(() => {
 const created = customers.find((c) => c.userIdxno === assignUserIdxno && c.customerId);
 return created ? { kind: "package", customer: created } : null;
 });

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
  () => createPPPoEColumns(router, dispatch, handleToggleActive, setServiceRequest),
  [router, dispatch]
  );

 const activeCount = customers.filter((c) => c.isActive).length;
 const subActive = customers.filter((c) => c.isSubActive).length;
 // a PPPoE account with no package yet cannot connect
 const awaitingPackage = customers.filter((c) => c.customerId && !c.packageName);

 return (
 <>
 <div className="space-y-6">
{/* Header */}
  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <p className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
        Portal — PPPoE Clients
      </p>
      <h1 className="text-3xl font-sans font-normal text-foreground">PPPoE Clients.</h1>
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
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <Button asChild variant="outline">
        <Link href="/portal/pppoe/packages">
          <Boxes className="h-4 w-4" /> Packages
        </Link>
      </Button>
      {perms.canCreate && (
        <Button
          onClick={() => requireCompany(() => router.push("/customers/new"))}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-black hover:bg-amber-400 transition shadow-lg shadow-amber-500/20 shrink-0"
        >
          <Plus className="h-4 w-4" /> Add Client
        </Button>
      )}
    </div>
  </div>

  {awaitingPackage.length > 0 && (
    <div className="flex flex-col gap-2 rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p>
        {awaitingPackage.length === 1
          ? `${awaitingPackage[0].fullName || awaitingPackage[0].username} has no package yet and cannot connect.`
          : `${awaitingPackage.length} clients have no package yet and cannot connect.`}
      </p>
      {perms.canEdit && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setServiceRequest({ kind: "package", customer: awaitingPackage[0] })}
        >
          {awaitingPackage.length === 1 ? "Assign package" : "Assign the first one"}
        </Button>
      )}
    </div>
  )}

 {/* Table */}
 <DataTable
 columns={columns}
 data={customers}
 searchPlaceholder="Search by name, username, package…"
 />
 </div>

 <PppoeServiceDialog
 request={serviceRequest}
 onClose={() => {
 setServiceRequest(null);
 // drop ?assign= so a reload does not reopen the dialog
 if (assignUserIdxno) router.replace("/portal/pppoe");
 }}
 />
 <RenewSubscriptionSheet customers={customers} />
 <ChangePasswordSheet customers={customers} />
 </>
 );
}
