import React from "react";
import { AddEquipmentForm } from "@/components/equipment/AddEquipmentForm";

export default function NewEquipmentPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] p-4 text-zinc-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <span className="text-[11px] font-mono tracking-wider text-zinc-500 uppercase">
            EQUIPMENT — NEW
          </span>
          <h1 className="text-3xl font-serif font-semibold text-white">Add hardware</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Track a piece of hardware from stockroom to subscriber.
          </p>
        </div>

        <AddEquipmentForm />
      </div>
    </div>
  );
}