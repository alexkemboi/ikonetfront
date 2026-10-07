"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { EquipmentItem, EquipmentPage, EquipmentStatus } from "@/lib/types/equipment";
import { getEquipmentHistory, updateEquipment } from "@/actions/equipment";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { DataTableFilterPill } from "@/components/shared/data-table-filter-pill";

interface HistoryEntry {
  action: string;
  operator: string | null;
  createdAt: string;
  reason: string | null;
  changes: Record<string, { from: unknown; to: unknown }> | null;
}

const statuses: Array<"ALL" | EquipmentStatus> = ["ALL", "IN_STOCK", "INSTALLED", "RETURNED", "DAMAGED", "SOLD", "RMA"];
const types = ["ROUTER", "SWITCH", "CPE_MODEM", "ONU", "ANTENNA", "SMART_TV", "WIFI_AP", "CABLE"] as const;

export function EquipmentDataTable({ pageData, canEdit }: { pageData: EquipmentPage; canEdit: boolean }) {
  const router = useRouter();
  const [history, setHistory] = useState<{ asset: EquipmentItem; entries: HistoryEntry[] } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [correction, setCorrection] = useState<EquipmentItem | null>(null);
  const [serialNumber, setSerialNumber] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionMessage, setCorrectionMessage] = useState("");
  const [savingCorrection, setSavingCorrection] = useState(false);
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const currentStatus = (params.get("status") as EquipmentStatus | null) ?? "ALL";
  const currentType = params.get("type") ?? "ALL";
  const qualityFilter = params.get("dataQuality") ?? "";
  const search = params.get("search") ?? "";

  function update(values: Record<string, string | null>) {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.push(`/network/equipment${next.size ? `?${next}` : ""}`);
  }

  async function openHistory(asset: EquipmentItem) {
    setHistory({ asset, entries: [] });
    setHistoryLoading(true);
    setHistoryError("");
    const result = await getEquipmentHistory(asset.id);
    setHistoryLoading(false);
    if (result.success && result.data) setHistory({ asset, entries: result.data as HistoryEntry[] });
    else setHistoryError(`${result.message}${result.requestId ? ` · Ref: ${result.requestId}` : ""}`);
  }

  async function saveCorrection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!correction) return;
    const nextSerial = serialNumber.trim();
    const previousSerial = correction.serialNumber ?? "";
    if (nextSerial === previousSerial) {
      setCorrection(null);
      return;
    }
    if (nextSerial && !correctionReason.trim()) {
      setCorrectionMessage("Enter the reason for this serial correction.");
      return;
    }
    setSavingCorrection(true);
    setCorrectionMessage("");
    const patch = nextSerial
      ? { serialNumber: nextSerial, dataQuality: "VERIFIED" as const, reason: correctionReason.trim() }
      : { clearFields: ["serialNumber"], dataQuality: "MISSING" as const, reason: correctionReason.trim() || undefined };
    const result = await updateEquipment(correction.id, patch);
    setSavingCorrection(false);
    if (!result.success) {
      setCorrectionMessage(`${result.message}${result.requestId ? ` · Ref: ${result.requestId}` : ""}`);
      return;
    }
    setCorrection(null);
    router.refresh();
  }

  const columns: ColumnDef<EquipmentItem>[] = [
    {
      id: "asset",
      header: "Asset",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div>
            <p className="font-medium">{item.assetTag}</p>
            <p className="text-xs text-muted-foreground">
              {item.model ?? "—"}
              {item.dataQuality === "VERIFIED" && item.serialNumber ? ` · S/N ${item.serialNumber}` : ""}
            </p>
            {item.needsCorrection && (
              <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-[10px] text-amber-900">
                Needs correction · {item.dataQuality}
              </span>
            )}
          </div>
        );
      },
    },
    { accessorKey: "type", header: "Type" },
    { id: "assignedTo", header: "Assigned to", cell: ({ row }) => row.original.assignedSubscriberName ?? "—" },
    { id: "cost", header: "Cost", cell: ({ row }) => <span className="tabular-nums">KES {row.original.costPrice}</span> },
    { id: "paid", header: "Paid", cell: ({ row }) => <span className="tabular-nums">KES {row.original.paidSoFar}</span> },
    { id: "unpaid", header: "Unpaid", cell: ({ row }) => <span className="tabular-nums">KES {row.original.unpaidBalance}</span> },
    { accessorKey: "status", header: "Status" },
    {
      id: "history",
      header: "History",
      cell: ({ row }) => (
        <Button type="button" variant="link" size="sm" className="h-auto p-0 text-sm" onClick={() => void openHistory(row.original)}>
          View
        </Button>
      ),
    },
    ...(canEdit
      ? [
          {
            id: "correction",
            header: "Correction",
            cell: ({ row }: { row: { original: EquipmentItem } }) =>
              row.original.needsCorrection ? (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-sm"
                  onClick={() => {
                    setCorrection(row.original);
                    setSerialNumber(row.original.serialNumber ?? "");
                    setCorrectionReason("");
                    setCorrectionMessage("");
                  }}
                >
                  Correct serial
                </Button>
              ) : null,
          } satisfies ColumnDef<EquipmentItem>,
        ]
      : []),
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={pageData.content}
        manualPagination
        pageCount={pageData.totalPages}
        pageIndex={pageData.number}
        pageSize={pageData.size}
        totalRows={pageData.totalElements}
        onPaginationChange={(pageIndex, pageSize) => update({ page: String(pageIndex), size: String(pageSize) })}
        hideSearch
        filters={
          <>
            <input
              type="search"
              defaultValue={search}
              onKeyDown={(event) => {
                if (event.key === "Enter") update({ search: event.currentTarget.value || null, page: null });
              }}
              placeholder="Search tag, model, serial, subscriber..."
              className="h-8 w-full rounded-md border border-border bg-background px-3 text-xs lg:max-w-sm"
            />
            <div className="flex flex-wrap gap-1">
              {statuses.map((status) => (
                <DataTableFilterPill
                  key={status}
                  active={currentStatus === status}
                  onClick={() => update({ status: status === "ALL" ? null : status, page: null })}
                >
                  {status.replaceAll("_", " ")}
                  {status === "ALL" ? ` (${pageData.totalElements})` : ""}
                </DataTableFilterPill>
              ))}
            </div>
            <select
              aria-label="Filter equipment type"
              value={currentType}
              onChange={(event) => update({ type: event.target.value === "ALL" ? null : event.target.value, page: null })}
              className="h-8 rounded-md border bg-background px-2 text-xs"
            >
              <option value="ALL">All types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <DataTableFilterPill
              active={Boolean(qualityFilter)}
              onClick={() => update({ dataQuality: qualityFilter === "NEEDS_CORRECTION" ? null : "NEEDS_CORRECTION", page: null })}
            >
              Needs correction
            </DataTableFilterPill>
          </>
        }
      />
      {correction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onClick={() => setCorrection(null)}>
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="asset-correction-title"
            className="w-full max-w-lg space-y-4 rounded-lg border bg-card p-5"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => void saveCorrection(event)}
          >
            <div>
              <h2 id="asset-correction-title" className="text-lg font-medium">
                Correct serial · {correction.assetTag}
              </h2>
              <p className="text-sm text-muted-foreground">Placeholder serials are not shown as verified until the backend accepts the correction.</p>
            </div>
            <label className="block text-sm">
              Serial number
              <input
                autoFocus
                value={serialNumber}
                onChange={(event) => setSerialNumber(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3"
                placeholder="Enter the verified serial"
              />
            </label>
            <label className="block text-sm">
              Reason
              <input
                value={correctionReason}
                onChange={(event) => setCorrectionReason(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3"
                placeholder="Required for serial correction"
              />
            </label>
            {correctionMessage && (
              <p role="alert" className="text-sm text-destructive">
                {correctionMessage}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setCorrection(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={savingCorrection}>
                {savingCorrection ? "Saving…" : "Save correction"}
              </Button>
            </div>
          </form>
        </div>
      )}
      {history && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onClick={() => setHistory(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="asset-history-title"
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-card p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 id="asset-history-title" className="text-lg font-medium">
                History · {history.asset.assetTag}
              </h2>
              <button type="button" aria-label="Close history" onClick={() => setHistory(null)}>
                Close
              </button>
            </div>
            {historyLoading && <p className="py-6 text-sm">Loading history…</p>}
            {historyError && (
              <p role="alert" className="py-4 text-sm text-destructive">
                {historyError}
              </p>
            )}
            <ol className="mt-4 space-y-4">
              {history.entries.map((entry) => (
                <li key={`${entry.action}-${entry.createdAt}`} className="border-l-2 pl-3">
                  <p className="text-sm font-medium">
                    {entry.action} · {entry.operator ?? "Legacy entry"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString()}
                    {entry.reason ? ` · ${entry.reason}` : ""}
                  </p>
                  {entry.changes && (
                    <dl className="mt-2 space-y-1 text-xs">
                      {Object.entries(entry.changes).map(([field, change]) => (
                        <div key={field} className="flex gap-2">
                          <dt className="font-medium">{field}</dt>
                          <dd>
                            {String(change.from ?? "—")} → {String(change.to ?? "—")}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </>
  );
}
