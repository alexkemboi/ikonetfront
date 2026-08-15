import React from "react";
import { ChevronRight } from "lucide-react";
import { RenewalDueItem } from "@/lib/types/dashboard";

interface Props {
  items: RenewalDueItem[];
}

export function RenewalsDueCard({ items }: Props) {
  return (
    <div className="flex flex-col rounded-2xl border border-[#262626] bg-[#161616] p-6 shadow-xl">
      <div className="flex items-baseline justify-between border-b border-[#262626] pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Renewals due</h2>
          <p className="text-xs text-zinc-400">Next 48 hours · {items.length} subscribers</p>
        </div>
      </div>

      <div className="mt-4 divide-y divide-zinc-800/60">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-3 hover:bg-zinc-800/30 transition rounded-lg px-2"
          >
            {/* Avatar & Subscriber Info */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 font-mono text-xs font-semibold text-rose-300">
                {item.subscriberCode.charAt(0)}
              </div>
              <div>
                <div className="font-mono text-sm font-semibold text-white">
                  {item.subscriberCode}
                </div>
                <div className="font-mono text-xs text-zinc-400">
                  {item.phoneMasked}
                </div>
              </div>
            </div>

            {/* Countdown Badge */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-medium text-rose-400">
                {item.formattedCountdown}
              </span>
              <ChevronRight className="h-4 w-4 text-zinc-600" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}