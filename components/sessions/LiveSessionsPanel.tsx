"use client";

import { useState } from "react";
import type { LiveSessionItem, LiveSessionKpis } from "@/lib/types/sessions";
import { LiveSessionHeaderCards } from "@/components/sessions/LiveSessionHeaderCards";
import { LiveSessionDataTable } from "@/components/sessions/LiveSessionDataTable";

/** Summary cards and the session table, refreshed together without reloading the page. */
export function LiveSessionsPanel({
  kpis,
  sessions,
  refreshIntervalSeconds,
}: {
  kpis: LiveSessionKpis;
  sessions: LiveSessionItem[];
  refreshIntervalSeconds: number;
}) {
  const [current, setCurrent] = useState(kpis);
  return (
    <>
      <LiveSessionHeaderCards kpis={current} />
      <LiveSessionDataTable
        sessions={sessions}
        refreshIntervalSeconds={refreshIntervalSeconds}
        onRefreshed={setCurrent}
      />
    </>
  );
}
