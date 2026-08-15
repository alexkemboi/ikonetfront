"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createEquipment } from "@/actions/equipment";
import { EquipmentType, EquipmentStatus } from "@/lib/types/equipment";

export function AddEquipmentForm() {
  const router = useRouter();
  const [name, setName] = useState("MikroTik hAP ac3");
  const [type, setType] = useState<EquipmentType>("router");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<EquipmentStatus>("in_stock");
  const [price, setPrice] = useState(0);
  const [paid, setPaid] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await createEquipment({
      name,
      type,
      model,
      serialNumber: serial,
      notes,
      status,
      costPrice: price,
      paidSoFar: paid,
    });

    setIsSubmitting(false);
    if (res.success) {
      router.push("/network/equipment");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pane 1: Item Identification */}
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-6 shadow-xl">
        <div className="border-b border-[#262626] pb-3">
          <h2 className="text-base font-semibold text-white">Item</h2>
          <p className="text-xs text-zinc-400">What it is and how to identify it.</p>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-mono text-zinc-400">Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#262626] bg-[#121212] p-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-400">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as EquipmentType)}
              className="mt-1 w-full rounded-lg border border-[#262626] bg-[#121212] p-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="router">router</option>
              <option value="modem">modem</option>
              <option value="ont_onu">ont / onu</option>
              <option value="switch">switch</option>
              <option value="access_point">access point</option>
              <option value="cable">cable</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-400">Model</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#262626] bg-[#121212] p-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-400">Serial</label>
            <input
              type="text"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#262626] bg-[#121212] p-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-400">Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#262626] bg-[#121212] p-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Pane 2: Assignment & Pricing */}
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-6 shadow-xl">
        <div className="border-b border-[#262626] pb-3">
          <h2 className="text-base font-semibold text-white">Assignment</h2>
          <p className="text-xs text-zinc-400">Who&apos;s holding it, status and pricing.</p>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-mono text-zinc-400">Subscriber <span className="text-zinc-500 font-sans">(Optional — leave blank if still in stock)</span></label>
            <input
              type="text"
              placeholder="Select subscriber..."
              className="mt-1 w-full rounded-lg border border-[#262626] bg-[#121212] p-2.5 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
              className="mt-1 w-full rounded-lg border border-[#262626] bg-[#121212] p-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="in_stock">in stock</option>
              <option value="assigned">assigned</option>
              <option value="returned">returned</option>
              <option value="damaged">damaged</option>
              <option value="sold">sold</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-400">Price (Ksh)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-[#262626] bg-[#121212] p-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-400">Paid so far (Ksh)</label>
            <input
              type="number"
              value={paid}
              onChange={(e) => setPaid(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-[#262626] bg-[#121212] p-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-[#262626] px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-amber-500 px-6 py-2.5 text-xs font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Equipment"}
        </button>
      </div>
    </form>
  );
}