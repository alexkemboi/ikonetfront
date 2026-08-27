"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Customer } from "@/lib/types/customer";
import { deleteCustomer, toggleCustomerActiveStatus, getCustomers } from "@/actions/customer";
import { useAppDispatch } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { RenewSubscriptionSheet } from "../../_components/RenewSubscriptionSheet";
import { ChangePasswordSheet } from "../../_components/ChangePasswordSheet";
import { createCustomerColumns } from "./columns";
import { usePermissions } from "@/providers/PermissionsProvider";

interface CustomerClientProps {
  initialTotalElements: number;
  initialActiveCount: number;
  initialPppoeCount: number;
  initialHotspotCount: number;
  initialData: Customer[];
}

export function CustomerClient({
  initialTotalElements,
  initialActiveCount,
  initialPppoeCount,
  initialHotspotCount,
  initialData,
}: CustomerClientProps) {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const perms    = usePermissions("/customers");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState<Customer[]>(initialData);
  const [totalElements, setTotalElements] = useState(initialTotalElements);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(async (p: number, s: number) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const response = await getCustomers(p, s);
      if (controller.signal.aborted) return;
      if (response?.success && response?.data) {
        setData(response.data.content || []);
        setTotalElements(response.data.totalElements ?? 0);
      } else {
        setData([]);
      }
    } catch {
      if (controller.signal.aborted) return;
      toast.error("Failed to load customers");
      setData([]);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchPage(newPage, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0);
    fetchPage(0, newSize);
  };

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

  const pageCount = Math.ceil(totalElements / pageSize);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">All Customers</h1>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <p className="text-sm text-muted-foreground">{totalElements} total</p>
              <Badge variant="outline" className="text-[11px] bg-success/10 text-success border-success/20">
                {initialActiveCount} active
              </Badge>
              <Badge variant="outline" className="text-[11px] bg-primary/10 text-primary border-primary/20">
                {initialPppoeCount} PPPoE
              </Badge>
              <Badge variant="outline" className="text-[11px] bg-warning/10 text-warning border-warning/20">
                {initialHotspotCount} Hotspot
              </Badge>
            </div>
          </div>
          {perms.canCreate && (
            <Button onClick={() => router.push("/customers/new")} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /> Add Customer
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={data}
          searchPlaceholder="Search by name, email, username, package…"
          manualPagination
          pageCount={pageCount}
          pageIndex={page}
          pageSize={pageSize}
          onPaginationChange={(newPage, newSize) => {
            if (newSize !== pageSize) handlePageSizeChange(newSize);
            else handlePageChange(newPage);
          }}
          loading={loading}
        />
      </div>

      <RenewSubscriptionSheet customers={data} />
      <ChangePasswordSheet customers={data} />
    </>
  );
}