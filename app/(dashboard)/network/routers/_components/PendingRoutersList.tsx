"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NetworkRouter } from "@/lib/types/network-router";
import { Settings2, Wifi } from "lucide-react";

interface Props {
  pending: NetworkRouter[];
  onFinalize: (router: NetworkRouter) => void;
}

function buildColumns(
  onFinalize: (router: NetworkRouter) => void
): ColumnDef<NetworkRouter>[] {
  return [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{row.original.id}
        </span>
      ),
    },
    {
      accessorKey: "ipAddress",
      header: "IP Address",
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold">
          {row.original.ipAddress}
        </span>
      ),
    },
    {
      accessorKey: "routerName",
      header: "Name",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground italic">
          {row.original.routerName || "Not configured"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: () => (
        <Badge
          variant="outline"
          className="text-[10px] bg-warning/10 text-warning border-warning/20"
        >
          Pending Setup
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1.5"
          onClick={() => onFinalize(row.original)}
        >
          <Settings2 className="w-3 h-3" />
          Finalize Setup
        </Button>
      ),
    },
  ];
}

export default function PendingRoutersList({ pending, onFinalize }: Props) {
  const columns = buildColumns(onFinalize);

  if (pending.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <Wifi className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-semibold text-foreground">No pending routers</p>
        <p className="text-xs text-muted-foreground mt-1">
          New devices will appear here automatically when detected.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto max-h-[calc(100vh-380px)] min-h-72 overflow-y-auto rounded-xl">
      <DataTable
        columns={columns}
        data={pending}
        searchPlaceholder="Search by IP or name…"
      />
    </div>
  );
}
