"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEquipment } from "@/actions/equipment";
import type { EquipmentStatus, EquipmentType } from "@/lib/types/equipment";

export function AddEquipmentForm() {
  const router = useRouter();
  const [assetTag, setAssetTag] = useState("");
  const [type, setType] = useState<EquipmentType>("ROUTER");
  const [status, setStatus] = useState<EquipmentStatus>("IN_STOCK");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [costPrice, setCostPrice] = useState("0.00");
  const [paidSoFar, setPaidSoFar] = useState("0.00");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result = await createEquipment({ assetTag, type, status, model: model || null, serialNumber: serialNumber || null, costPrice, paidSoFar, dataQuality: serialNumber ? "VERIFIED" : "MISSING", reason: reason || undefined });
    setBusy(false);
    if (result.success) router.push("/network/equipment");
    else setMessage(`${result.message}${result.requestId ? ` · Ref: ${result.requestId}` : ""}`);
  }

  return <form onSubmit={submit} className="space-y-5 rounded-lg border border-border bg-card p-5">
    <div><label htmlFor="asset-tag" className="text-sm">Asset tag *</label><input id="asset-tag" required value={assetTag} onChange={(e) => setAssetTag(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3" /></div>
    <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="asset-type" className="text-sm">Type *</label><select id="asset-type" value={type} onChange={(e) => setType(e.target.value as EquipmentType)} className="mt-1 h-10 w-full rounded-md border bg-background px-3">{["ROUTER","SWITCH","CPE_MODEM","ONU","ANTENNA","SMART_TV","WIFI_AP","CABLE"].map((item) => <option key={item}>{item}</option>)}</select></div><div><label htmlFor="asset-status" className="text-sm">Status *</label><select id="asset-status" value={status} onChange={(e) => setStatus(e.target.value as EquipmentStatus)} className="mt-1 h-10 w-full rounded-md border bg-background px-3">{["IN_STOCK","INSTALLED","RETURNED","DAMAGED","SOLD","RMA"].map((item) => <option key={item}>{item}</option>)}</select></div></div>
    <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="asset-model" className="text-sm">Model</label><input id="asset-model" value={model} onChange={(e) => setModel(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3" /></div><div><label htmlFor="asset-serial" className="text-sm">Serial number</label><input id="asset-serial" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3" /></div></div>
    <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="asset-cost" className="text-sm">Cost price (KES)</label><input id="asset-cost" inputMode="decimal" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3" /></div><div><label htmlFor="asset-paid" className="text-sm">Paid so far (KES)</label><input id="asset-paid" inputMode="decimal" value={paidSoFar} onChange={(e) => setPaidSoFar(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3" /></div></div>
    {!serialNumber && <div><label htmlFor="quality-reason" className="text-sm">Data quality note</label><input id="quality-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3" placeholder="Optional reason for missing serial" /></div>}
    {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
    <div className="flex justify-end gap-2"><button type="button" onClick={() => router.back()} className="rounded-md border px-4 py-2 text-sm">Cancel</button><button disabled={busy} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{busy ? "Saving..." : "Save asset"}</button></div>
  </form>;
}
