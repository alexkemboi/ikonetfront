"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { History } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import type { ApiResponse } from "@/lib/types/auth";
import type { Paged, SignInEvent } from "@/lib/types/usersAccess";
import { describeDevice, EVENT_TYPE_OPTIONS, EventBadge, formatDateTime } from "./status";

type Loader = (params: { q?: string; type?: string; page: number; size: number }) => Promise<ApiResponse<Paged<SignInEvent> | null>>;

/**
 * Sign-in activity, paged on the server. With `showUser` each row names and links the account
 * (the organisation-wide list); without it, the list belongs to one person.
 */
export function SignInEventsTable({
  initial,
  load,
  showUser,
  searchable,
}: {
  initial: Paged<SignInEvent> | null;
  load: Loader;
  showUser?: boolean;
  searchable?: boolean;
}) {
  const [page, setPage] = useState<Paged<SignInEvent>>(initial ?? { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(initial?.size ?? 20);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [error, setError] = useState<string | null>(initial ? null : "Sign-in activity could not be loaded.");
  const [isPending, startTransition] = useTransition();
  const sequence = useRef(0);
  const first = useRef(true);

  const reload = useCallback(() => {
    const id = ++sequence.current;
    startTransition(async () => {
      const res = await load({ q: search || undefined, type: type || undefined, page: pageIndex, size: pageSize });
      if (id !== sequence.current) return;
      if (!res.success || !res.data) {
        setError(res.message || "Sign-in activity could not be loaded.");
        return;
      }
      setError(null);
      setPage(res.data);
    });
  }, [load, search, type, pageIndex, pageSize]);

  useEffect(() => {
    if (first.current && initial) {
      first.current = false;
      return;
    }
    const timer = setTimeout(reload, 250);
    return () => clearTimeout(timer);
  }, [reload, initial]);

  const columns: ColumnDef<SignInEvent>[] = [
    {
      id: "occurredAt",
      header: "When",
      cell: ({ row }) => <span className="whitespace-nowrap text-xs tabular-nums">{formatDateTime(row.original.occurredAt)}</span>,
    },
    ...(showUser ? [{
      id: "username",
      header: "Person",
      cell: ({ row }: { row: { original: SignInEvent } }) => row.original.userId
        ? <Link href={`/system/users/${row.original.userId}`} className="text-sm font-medium hover:underline">{row.original.username}</Link>
        : <span className="text-sm">{row.original.username}</span>,
    } satisfies ColumnDef<SignInEvent>] : []),
    { id: "eventType", header: "Event", cell: ({ row }) => <EventBadge type={row.original.eventType} /> },
    {
      id: "detail",
      header: "Detail",
      cell: ({ row }) => (
        <span className="block max-w-80 truncate text-xs text-muted-foreground" title={row.original.detail ?? undefined}>
          {row.original.detail || "—"}{row.original.actor ? ` · by ${row.original.actor}` : ""}
        </span>
      ),
    },
    {
      id: "origin",
      header: "Device",
      cell: ({ row }) => (
        <div className="text-xs">
          <p className="whitespace-nowrap">{describeDevice(row.original.userAgent)}</p>
          <p className="tabular-nums text-muted-foreground">{row.original.ipAddress || "—"}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      <DataTable
        columns={columns}
        data={page.content}
        hideSearch={!searchable}
        searchPlaceholder="Search username, IP address or detail…"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPageIndex(0); }}
        manualPagination
        pageCount={Math.max(1, page.totalPages)}
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalRows={page.totalElements}
        onPaginationChange={(next, size) => { if (size !== pageSize) setPageSize(size); setPageIndex(next); }}
        loading={isPending}
        columnsHiddenUntilLg={["detail"]}
        emptyState={
          <div className="flex flex-col items-center gap-2 py-6">
            <History className="size-6 text-muted-foreground/60" aria-hidden />
            <p>{type || search ? "No activity matches." : "No sign-in activity recorded yet."}</p>
          </div>
        }
        filters={searchable &&
          <select aria-label="Filter by event" value={type} onChange={(e) => { setType(e.target.value); setPageIndex(0); }}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs">
            <option value="">All events</option>
            {EVENT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        }
      />
    </div>
  );
}
