"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import type { InvoiceItem } from "@/lib/types/payments";

interface Props {
  invoices: InvoiceItem[];
}

const STATUS_STYLE: Record<InvoiceItem["status"], string> = {
  PAID: "bg-emerald-500/15 text-emerald-400",
  OVERDUE: "bg-rose-500/15 text-rose-400",
  UNPAID: "bg-amber-500/15 text-amber-400",
  CANCELLED: "bg-zinc-500/15 text-muted-foreground",
  PENDING: "bg-amber-500/15 text-amber-400",
  PARTIAL: "bg-sky-500/15 text-sky-400",
};

export function InvoicesTable({ invoices }: Props) {
  const columns = useMemo<ColumnDef<InvoiceItem>[]>(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: "Number",
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">{row.original.invoiceNumber}</span>
        ),
      },
      {
        id: "customer",
        header: "Customer",
        accessorFn: (inv) => `${inv.customerName} ${inv.customerPhone}`,
        cell: ({ row }) => (
          <div>
            <div className="font-sans text-foreground">{row.original.customerName}</div>
            <div className="text-[11px] text-muted-foreground">{row.original.customerPhone}</div>
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="font-bold text-foreground">Ksh {row.original.amount.toLocaleString()}</span>
        ),
      },
      {
        accessorKey: "outstanding",
        header: "Outstanding",
        cell: ({ row }) => (
          <span className="text-amber-400">Ksh {row.original.outstanding.toLocaleString()}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[row.original.status]}`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.dueDate}</span>,
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={invoices}
      searchPlaceholder="Search invoices…"
    />
  );
}
