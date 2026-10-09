"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, Loader2, Package, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { usePermissions } from "@/providers/PermissionsProvider";
import { useCompanyScope } from "@/providers/CompanyScopeProvider";
import { updatePppoePackageAction, type PppoePackage } from "@/actions/pppoe";
import { PppoePackageDialog } from "./PppoePackageDialog";

function isActive(pkg: PppoePackage): boolean {
  return pkg.isActive !== false;
}

function formatPrice(price: number | null): string {
  return price == null ? "Not set" : `KES ${Number(price).toLocaleString("en-KE")}`;
}

/**
 * The company's PPPoE packages: what a customer is put on from PPPoE Clients,
 * and what an M-Pesa payment renews. Separate from the hotspot and TV packages
 * under Internet Packages.
 */
export function PppoePackagesClient({
  initialPackages,
  loadError,
}: {
  initialPackages: PppoePackage[];
  loadError: string | null;
}) {
  const perms = usePermissions("/portal/pppoe");
  const { requireCompany } = useCompanyScope();
  const [packages, setPackages] = useState(initialPackages);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PppoePackage | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function handleSaved(saved: PppoePackage) {
    setPackages((list) =>
      list.some((p) => p.id === saved.id) ? list.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...list]
    );
  }

  async function toggleActive(pkg: PppoePackage) {
    setTogglingId(pkg.id);
    const res = await updatePppoePackageAction(pkg.id, { isActive: !isActive(pkg) });
    setTogglingId(null);
    if (!res.success || !res.data) {
      toast.error("Could not update the package", { description: res.message });
      return;
    }
    handleSaved(res.data);
    toast.success(isActive(res.data) ? "Package is on sale again" : "Package withdrawn from sale", {
      description: isActive(res.data) ? undefined : "Customers already on it keep it and can still renew.",
    });
  }

  const columns = useMemo<ColumnDef<PppoePackage>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Package",
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        id: "speed",
        header: "Speed (down / up)",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.downloadSpeed ?? "—"} / {row.original.uploadSpeed ?? "—"} Mbps
          </span>
        ),
      },
      {
        accessorKey: "durationDays",
        header: "Period",
        cell: ({ row }) => <span className="tabular-nums">{row.original.durationDays ?? "—"} days</span>,
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => (
          <span className={row.original.price == null ? "text-warning" : "tabular-nums"}>
            {formatPrice(row.original.price)}
          </span>
        ),
      },
      {
        id: "dataCap",
        header: "Data cap",
        cell: ({ row }) =>
          row.original.dataCapMb ? (
            <span className="tabular-nums">{(row.original.dataCapMb / 1024).toLocaleString("en-KE")} GB</span>
          ) : (
            <span className="text-muted-foreground">Unlimited</span>
          ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) =>
          isActive(row.original) ? (
            <Badge variant="outline" className="text-[11px] bg-success/10 text-success border-success/20">On sale</Badge>
          ) : (
            <Badge variant="outline" className="text-[11px]">Withdrawn</Badge>
          ),
      },
      ...(perms.canEdit
        ? ([
            {
              id: "actions",
              enableHiding: false,
              cell: ({ row }) => {
                const pkg = row.original;
                const busy = togglingId === pkg.id;
                return (
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" disabled={busy} onClick={() => { setEditing(pkg); setDialogOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" disabled={busy} onClick={() => toggleActive(pkg)}>
                      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {isActive(pkg) ? "Withdraw" : "Put on sale"}
                    </Button>
                  </div>
                );
              },
            },
          ] as ColumnDef<PppoePackage>[])
        : []),
    ],
    // toggleActive only reads state setters and the row it is given
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [perms.canEdit, togglingId]
  );

  const onSale = packages.filter(isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link href="/portal/pppoe" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> PPPoE Clients
          </Link>
          <h1 className="text-3xl font-sans font-normal text-foreground">PPPoE Packages.</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {packages.length} {packages.length === 1 ? "package" : "packages"} · {onSale} on sale
          </p>
        </div>
        {perms.canCreate && (
          <Button onClick={() => requireCompany(openCreate)} className="shrink-0 gap-2">
            <Plus className="h-4 w-4" /> Add Package
          </Button>
        )}
      </div>

      {loadError ? (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Packages could not be loaded: {loadError}
        </p>
      ) : packages.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">No PPPoE packages yet</p>
            <p className="max-w-md text-sm text-muted-foreground">
              A PPPoE customer cannot connect until they are put on a package. Create the first one, then assign it
              from PPPoE Clients.
            </p>
          </div>
          {perms.canCreate && (
            <Button onClick={() => requireCompany(openCreate)} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Create Package
            </Button>
          )}
        </div>
      ) : (
        <DataTable columns={columns} data={packages} searchPlaceholder="Search packages…" />
      )}

      <PppoePackageDialog
        open={dialogOpen}
        editing={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
