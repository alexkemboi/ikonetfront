"use client";

import { useState } from "react";
import type { EquipmentItem, EquipmentPage, EquipmentStatus } from "@/lib/types/equipment";
import { getEquipmentHistory, updateEquipment } from "@/actions/equipment";
import { useRouter } from "next/navigation";

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

  return <div className="overflow-hidden rounded-lg border border-border bg-card">
    <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-1">
        {statuses.map((status) => <button key={status} type="button" onClick={() => update({ status: status === "ALL" ? null : status, page: null })} className={`rounded-md px-2.5 py-1.5 text-xs ${currentStatus === status ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>{status.replaceAll("_", " ")}{status === "ALL" ? ` (${pageData.totalElements})` : ""}</button>)}
        <select aria-label="Filter equipment type" value={currentType} onChange={(event) => update({ type: event.target.value === "ALL" ? null : event.target.value, page: null })} className="h-8 rounded-md border bg-background px-2 text-xs"><option value="ALL">All types</option>{types.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select>
        <button type="button" onClick={() => update({ dataQuality: qualityFilter === "NEEDS_CORRECTION" ? null : "NEEDS_CORRECTION", page: null })} className={`rounded-md px-2.5 py-1.5 text-xs ${qualityFilter ? "bg-amber-100 text-amber-950" : "text-muted-foreground hover:text-foreground"}`}>Needs correction</button>
      </div>
      <input type="search" defaultValue={search} onKeyDown={(event) => { if (event.key === "Enter") update({ search: event.currentTarget.value || null, page: null }); }} placeholder="Search tag, model, serial, subscriber..." className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm lg:max-w-sm" />
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[1120px] text-left text-sm"><thead><tr className="border-b text-[11px] uppercase text-muted-foreground"><th className="p-3">Asset</th><th className="p-3">Type</th><th className="p-3">Assigned to</th><th className="p-3">Cost</th><th className="p-3">Paid</th><th className="p-3">Unpaid</th><th className="p-3">Status</th><th className="p-3">History</th>{canEdit && <th className="p-3">Correction</th>}</tr></thead><tbody>
      {pageData.content.length === 0 ? <tr><td colSpan={canEdit ? 9 : 8} className="p-12 text-center text-sm text-muted-foreground">No equipment matches this query.</td></tr> : pageData.content.map((item: EquipmentItem) => <tr key={item.id} className="border-b hover:bg-muted/40"><td className="p-3"><p className="font-medium">{item.assetTag}</p><p className="text-xs text-muted-foreground">{item.model ?? "—"}{item.dataQuality === "VERIFIED" && item.serialNumber ? ` · S/N ${item.serialNumber}` : ""}</p>{item.needsCorrection && <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-[10px] text-amber-900">Needs correction · {item.dataQuality}</span>}</td><td className="p-3">{item.type}</td><td className="p-3">{item.assignedSubscriberName ?? "—"}</td><td className="p-3 tabular-nums">KES {item.costPrice}</td><td className="p-3 tabular-nums">KES {item.paidSoFar}</td><td className="p-3 tabular-nums">KES {item.unpaidBalance}</td><td className="p-3">{item.status}</td><td className="p-3"><button type="button" className="text-primary underline" onClick={() => void openHistory(item)}>View</button></td>{canEdit && <td className="p-3">{item.needsCorrection && <button type="button" className="text-primary underline" onClick={() => { setCorrection(item); setSerialNumber(item.serialNumber ?? ""); setCorrectionReason(""); setCorrectionMessage(""); }}>Correct serial</button>}</td>}</tr>)}
    </tbody></table></div>
    <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground"><span>Showing {pageData.totalElements === 0 ? 0 : pageData.number * pageData.size + 1}-{Math.min((pageData.number + 1) * pageData.size, pageData.totalElements)} of {pageData.totalElements}</span><div className="flex items-center gap-2"><button type="button" disabled={pageData.number <= 0} onClick={() => update({ page: String(pageData.number - 1) })} className="rounded border px-2 py-1 disabled:opacity-40">Previous</button><span>{pageData.number + 1} / {Math.max(1, pageData.totalPages)}</span><button type="button" disabled={pageData.number + 1 >= pageData.totalPages} onClick={() => update({ page: String(pageData.number + 1) })} className="rounded border px-2 py-1 disabled:opacity-40">Next</button></div></div>
    {correction && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onClick={() => setCorrection(null)}><form role="dialog" aria-modal="true" aria-labelledby="asset-correction-title" className="w-full max-w-lg space-y-4 rounded-lg border bg-card p-5" onClick={(event) => event.stopPropagation()} onSubmit={(event) => void saveCorrection(event)}><div><h2 id="asset-correction-title" className="text-lg font-medium">Correct serial · {correction.assetTag}</h2><p className="text-sm text-muted-foreground">Placeholder serials are not shown as verified until the backend accepts the correction.</p></div><label className="block text-sm">Serial number<input autoFocus value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3" placeholder="Enter the verified serial" /></label><label className="block text-sm">Reason<input value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3" placeholder="Required for serial correction" /></label>{correctionMessage && <p role="alert" className="text-sm text-destructive">{correctionMessage}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={() => setCorrection(null)} className="rounded-md border px-3 py-2 text-sm">Cancel</button><button type="submit" disabled={savingCorrection} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">{savingCorrection ? "Saving…" : "Save correction"}</button></div></form></div>}
    {history && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onClick={() => setHistory(null)}><section role="dialog" aria-modal="true" aria-labelledby="asset-history-title" className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-card p-5" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><h2 id="asset-history-title" className="text-lg font-medium">History · {history.asset.assetTag}</h2><button type="button" aria-label="Close history" onClick={() => setHistory(null)}>Close</button></div>{historyLoading && <p className="py-6 text-sm">Loading history…</p>}{historyError && <p role="alert" className="py-4 text-sm text-destructive">{historyError}</p>}<ol className="mt-4 space-y-4">{history.entries.map((entry) => <li key={`${entry.action}-${entry.createdAt}`} className="border-l-2 pl-3"><p className="text-sm font-medium">{entry.action} · {entry.operator ?? "Legacy entry"}</p><p className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}{entry.reason ? ` · ${entry.reason}` : ""}</p>{entry.changes && <dl className="mt-2 space-y-1 text-xs">{Object.entries(entry.changes).map(([field, change]) => <div key={field} className="flex gap-2"><dt className="font-medium">{field}</dt><dd>{String(change.from ?? "—")} → {String(change.to ?? "—")}</dd></div>)}</dl>}</li>)}</ol></section></div>}
  </div>;
}
