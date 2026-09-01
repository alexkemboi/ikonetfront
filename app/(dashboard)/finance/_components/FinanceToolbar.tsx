"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  from?: string;
  to?: string;
}

/**
 * Server-driven date controls for the executive dashboard. Local state is
 * seeded from `searchParams`; Refresh replaces the URL so the server
 * re-renders with the new window — no client-side data fetching.
 */
export default function FinanceToolbar({ from, to }: Props) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(from ?? "");
  const [endDate, setEndDate] = useState(to ?? "");

  const apply = () => {
    const qs = new URLSearchParams();
    if (startDate) qs.set("from", startDate);
    if (endDate) qs.set("to", endDate);
    router.replace(qs.size > 0 ? `/finance?${qs.toString()}` : "/finance");
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
        />
      </div>
      <Button variant="outline" size="sm" className="h-8 gap-1" onClick={apply}>
        <RefreshCw className="w-3.5 h-3.5" />
        Refresh
      </Button>
    </div>
  );
}