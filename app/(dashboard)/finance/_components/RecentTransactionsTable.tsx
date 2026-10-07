"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { cn } from "@/lib/utils";
import type { AccountPosting } from "@/lib/types/finance";

function formatKes(n: number): string {
  return `KES ${n.toLocaleString()}`;
}

const columns: ColumnDef<AccountPosting>[] = [
  {
    accessorKey: "occurredAt",
    header: "Date",
    cell: ({ row }) => (
      <span className="font-sans tabular-nums text-xs text-muted-foreground">
        {row.original.occurredAt.replace("T", " ").slice(0, 16)}
      </span>
    ),
  },
  {
    accessorKey: "accountCode",
    header: "Account",
    cell: ({ row }) => (
      <span className="font-sans tabular-nums font-semibold text-primary text-xs">
        {row.original.accountCode}
      </span>
    ),
  },
  {
    accessorKey: "sourceType",
    header: "Source",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{row.original.sourceType}</span>
    ),
  },
  {
    accessorKey: "memo",
    header: "Memo",
    cell: ({ row }) => (
      <span className="text-xs text-foreground max-w-[220px] truncate block">
        {row.original.memo || "—"}
      </span>
    ),
  },
  {
    accessorKey: "serviceType",
    header: "Service",
    cell: ({ row }) => (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
        {row.original.serviceType || "—"}
      </span>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = row.original.amount;
      return (
        <span
          className={cn(
            "text-right block font-bold text-xs tabular-nums",
            amount < 0 ? "text-success" : "text-foreground"
          )}
        >
          {amount < 0 ? "-" : "+"}
          {formatKes(Math.abs(amount))}
        </span>
      );
    },
  },
];

export default function RecentTransactionsTable({
  transactions,
  available,
}: {
  transactions: AccountPosting[];
  available: boolean;
}) {
  if (!available) {
    return (
      <div className="px-5 py-12 text-center text-sm text-muted-foreground">
        Recent transactions are unavailable.
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-sm text-muted-foreground">
        No recent transactions were returned.
      </div>
    );
  }

  return <DataTable columns={columns} data={transactions} searchPlaceholder="Search transactions…" />;
}
