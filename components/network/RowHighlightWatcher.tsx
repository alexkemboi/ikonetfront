"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Scrolls to and flashes the row whose `data-row-id` matches the `highlight`
 * query param (Omni-search deep links: /network/routers?highlight=…,
 * /finance/billing/payments?highlight=…, /customers/tickets?highlight=…).
 */
export default function RowHighlightWatcher() {
  const params = useSearchParams();
  const highlight = params.get("highlight");

  useEffect(() => {
    if (!highlight) return;
    const timer = setTimeout(() => {
      const row = document.querySelector<HTMLElement>(`[data-row-id="${CSS.escape(highlight)}"]`);
      if (!row) return;
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      row.classList.add("bg-amber-500/10");
      const restore = setTimeout(() => row.classList.remove("bg-amber-500/10"), 3000);
      return () => clearTimeout(restore);
    }, 120);
    return () => clearTimeout(timer);
  }, [highlight]);

  return null;
}