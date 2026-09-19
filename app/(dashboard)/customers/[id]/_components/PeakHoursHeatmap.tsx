"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";
import { getPeakHours } from "@/actions/customer360";
import {
  PeakHourDensity,
  heatmapCellColor,
  isoDayOfWeekToGridIndex,
} from "@/lib/types/customer360";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataLoadError } from "./EmptyState";

interface PeakHoursHeatmapProps {
  customerId: number;
}

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const gb = bytes / 1_000_000_000;
  if (gb < 1) return `${Math.round(bytes / 1_000_000)} MB`;
  return `${gb.toFixed(1)} GB`;
}

export function PeakHoursHeatmap({ customerId }: PeakHoursHeatmapProps) {
  const [cells, setCells] = useState<PeakHourDensity[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPeakHours(customerId).then((res) => {
      if (cancelled) return;
      if (res?.success && res.data) setCells(res.data);
      setError(!res?.success);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const grid = useMemo<((PeakHourDensity | null)[][] | null)>(() => {
    if (!loaded) return null;
    const matrix: (PeakHourDensity | null)[][] = Array.from({ length: 7 }, () =>
      Array(24).fill(null)
    );
    for (const cell of cells) {
      const row = isoDayOfWeekToGridIndex(cell.dayOfWeek);
      if (row >= 0 && row < 7 && cell.hourOfDay >= 0 && cell.hourOfDay < 24) {
        matrix[row][cell.hourOfDay] = cell;
      }
    }
    return matrix;
  }, [cells, loaded]);

  const totalSessions = useMemo(
    () => cells.reduce((sum, cell) => sum + cell.sessionCount, 0),
    [cells]
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-normal">
          <Clock3 className="h-4 w-4 text-primary" />
          Peak hours
          <span className="text-xs font-normal text-muted-foreground">
            · last 90 days
          </span>
        </CardTitle>
        <div className="flex items-center gap-1.5 text-xs font-sans tabular-nums text-muted-foreground">
          <span>Quiet</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className="h-3 w-3 rounded"
              style={{ backgroundColor: heatmapCellColor(level) }}
            />
          ))}
          <span>Busy</span>
        </div>
      </CardHeader>
      <CardContent>
        {!loaded ? (
          <p className="text-sm text-muted-foreground">Loading peak hours…</p>
        ) : error ? (
          <DataLoadError message="Unable to load peak-hours data." />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-[44px_repeat(24,1fr)] gap-1.5 text-center text-[10px] font-sans tabular-nums text-muted-foreground">
                <span />
                {HOURS.map((hour) => (
                  <span key={hour}>{hour % 6 === 0 ? hour : ""}</span>
                ))}
              </div>
              <div className="mt-2 space-y-1.5">
                {DAY_HEADERS.map((day, rowIndex) => (
                  <div
                    key={day}
                    className="grid grid-cols-[44px_repeat(24,1fr)] items-center gap-1.5"
                  >
                    <span className="text-[11px] font-sans font-medium text-muted-foreground">
                      {day}
                    </span>
                    {HOURS.map((hour) => {
                      const cell = grid?.[rowIndex]?.[hour] ?? null;
                      return (
                        <div
                          key={hour}
                          title={
                            cell
                              ? `${day} ${hour}:00 · ${formatBytes(cell.totalBytes)} · ${cell.sessionCount} sessions`
                              : `${day} ${hour}:00`
                          }
                          className="h-5 w-full rounded-sm transition hover:scale-110 hover:border hover:border-foreground/40"
                          style={{ backgroundColor: heatmapCellColor(cell ? cell.intensity : 0) }}
                          data-testid="peak-cell"
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs font-sans tabular-nums text-muted-foreground">
                {totalSessions.toLocaleString()} RADIUS sessions in window
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}