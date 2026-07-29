"use client";

import { useState } from "react";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Settings2, Plus } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { RouterResponse } from "@/lib/types/network";
import { usePermissions } from "@/providers/PermissionsProvider";

interface RouterInventoryClientProps {
  initialRouters: RouterResponse[];
}

export function RouterInventoryClient({ initialRouters }: RouterInventoryClientProps) {
  const [routers] = useState(initialRouters);
  const perms = usePermissions("/network/routers");

  const columns: ColumnDef<RouterResponse>[] = [
    {
      accessorKey: "name",
      header: "Identity",
      cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
    },
    {
      accessorKey: "ipAddress",
      header: "IP Endpoint",
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.ipAddress}</span>,
    },
    {
      accessorKey: "model",
      header: "Hardware Model",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status ? "default" : "destructive"}>
          {row.original.status ? "ONLINE" : "OFFLINE"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          {perms.canView && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/network/routers/${row.original.id}/monitoring`} className="flex gap-1">
                <Activity className="h-3 w-3 text-primary" /> Live NOC
              </Link>
            </Button>
          )}
          {perms.canEdit && (
            <Button variant="ghost" size="icon">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {perms.canCreate && (
        <div className="flex justify-end">
          <Button asChild className="flex items-center gap-2">
            <Link href="/network/routers/onboard">
              <Plus className="h-4 w-4" /> Onboard Edge Device
            </Link>
          </Button>
        </div>
      )}
      <DataTable columns={columns} data={routers} />
    </div>
  );
}