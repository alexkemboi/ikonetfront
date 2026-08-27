"use client";

import React, { useState } from "react";
import { Search, MoreHorizontal } from "lucide-react";
import { EquipmentItem, EquipmentStatus } from "@/lib/types/equipment";

interface Props {
  items: EquipmentItem[];
}

export function EquipmentDataTable({ items }: Props) {
  const [tab, setTab] = useState<"ALL" | EquipmentStatus>("ALL");
  const [search, setSearch] = useState("");

  const filtered = items.filter((item) => {
    if (tab !== "ALL" && item.status !== tab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.model && item.model.toLowerCase().includes(q)) ||
        (item.serialNumber && item.serialNumber.toLowerCase().includes(q)) ||
        (item.assignedSubscriberName && item.assignedSubscriberName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="rounded-2xl border border-[#262626] bg-[#161616] p-6 shadow-xl">
      {/* Top Filter Strip */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#262626] pb-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1 rounded-full bg-[#121212] p-1 border border-[#262626]">
          {(["ALL", "in_stock", "assigned", "returned", "damaged", "sold"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`rounded-full px-3.5 py-1 text-xs font-medium capitalize transition ${
                tab === s ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              {s.replace("_", " ")}{" "}
              <span className="font-mono text-zinc-500">
                {s === "ALL" ? items.length : items.filter((i) => i.status === s).length}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, model, serial, or subscriber..."
            className="h-9 w-72 rounded-lg border border-[#262626] bg-[#121212] pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#262626] text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
              <th className="py-3 px-3">ITEM</th>
              <th className="py-3 px-3">TYPE</th>
              <th className="py-3 px-3">ASSIGNED TO</th>
              <th className="py-3 px-3">PRICE</th>
              <th className="py-3 px-3">PAID</th>
              <th className="py-3 px-3">STATUS</th>
              <th className="py-3 px-3 text-right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 font-mono">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-500">
                  No equipment found in inventory.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-800/30 transition">
                  <td className="py-3.5 px-3 font-sans">
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      {item.model || "—"} {item.serialNumber ? `· S/N: ${item.serialNumber}` : ""}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 uppercase text-zinc-300">{item.type}</td>
                  <td className="py-3.5 px-3 font-sans text-zinc-300">
                    {item.assignedSubscriberName || "— (In Stock)"}
                  </td>
                  <td className="py-3.5 px-3 text-white">Ksh {item.costPrice.toLocaleString()}</td>
                  <td className="py-3.5 px-3 text-emerald-400">Ksh {item.paidSoFar.toLocaleString()}</td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                        item.status === "in_stock"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : item.status === "assigned"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button className="text-zinc-500 hover:text-white">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}