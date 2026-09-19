"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { getActivityHeatmap } from "@/actions/customer360";
import {
  ActivityHeatmapPoint,
  activityTierForBytes,
  heatmapCellColor,
} from "@/lib/types/customer360";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataLoadError } from "./EmptyState";

interface ActivityCalendarHeatmapProps {
  customerId: number;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CELL = 10;
const GAP = 2;
const STEP = CELL + GAP;
const DAYS_LOOKBACK = 364;
const LABEL_HEIGHT = 16;

function toKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const gb = bytes / 1_000_000_000;
  if (gb < 1) return `${Math.round(bytes / 1_000_000)} MB`;
  return `${gb.toFixed(1)} GB`;
}

interface Cell {
  date: Date;
  tier: number;
  totalBytes: number;
}

export function ActivityCalendarHeatmap({
  customerId,
}: ActivityCalendarHeatmapProps) {
  const [points, setPoints] = useState<ActivityHeatmapPoint[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getActivityHeatmap(customerId).then((res) => {
      if (cancelled) return;
      if (res?.success && res.data) setPoints(res.data);
      setError(!res?.success);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const byDate = useMemo(() => {
    const map = new Map<string, ActivityHeatmapPoint>();
    for (const point of points) map.set(point.date.slice(0, 10), point);
    return map;
  }, [points]);

  const cells = useMemo<Cell[]>(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - DAYS_LOOKBACK);
    const list: Cell[] = [];
    const current = new Date(start);
    while (current.getTime() <= today.getTime()) {
      const key = toKey(current);
      const point = byDate.get(key);
      const totalBytes = point ? point.totalBytes : 0;
      const tier =
        point && point.activityLevel !== undefined
          ? point.activityLevel
          : activityTierForBytes(totalBytes);
      list.push({ date: new Date(current.getTime()), tier, totalBytes });
      current.setDate(current.getDate() + 1);
    }
    return list;
  }, [byDate]);

  const cols = Math.max(Math.ceil(cells.length / 7), 1);
  const width = cols * STEP;

  const monthLabels = useMemo(() => {
    const labels: { x: number; label: string }[] = [];
    let lastMonth = -1;
    cells.forEach((cell, index) => {
      const week = Math.floor(index / 7);
      const month = cell.date.getMonth();
      if (month !== lastMonth) {
        labels.push({
          x: week * STEP,
          label: cell.date.toLocaleString("en", { month: "short" }),
        });
        lastMonth = month;
      }
    });
    return labels;
  }, [cells]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-normal">
          <CalendarDays className="h-4 w-4 text-primary" />
          Yearly activity
        </CardTitle>
        <div className="flex items-center gap-1.5 text-xs font-sans tabular-nums text-muted-foreground">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className="h-3 w-3 rounded-[2px]"
              style={{ backgroundColor: heatmapCellColor(level) }}
            />
          ))}
          <span>More</span>
        </div>
      </CardHeader>
      <CardContent>
        {!loaded ? (
          <p className="text-sm text-muted-foreground">Loading activity…</p>
        ) : error ? (
          <DataLoadError message="Unable to load activity data." />
        ) : (
          <div className="overflow-x-auto">
            <svg
              width={width}
              height={LABEL_HEIGHT + 7 * STEP}
              className="min-w-[636px]"
              role="img"
              data-testid="activity-heatmap"
            >
              {monthLabels.map(({ x, label }) => (
                <text
                  key={`${label}-${x}`}
                  x={x}
                  y={11}
                  style={{
                    fill: "var(--muted-foreground)",
                    fontSize: 10,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {label}
                </text>
              ))}
              {cells.map((cell, index) => {
                const week = Math.floor(index / 7);
                const row = cell.date.getDay();
                return (
                  <rect
                    key={toKey(cell.date)}
                    x={week * STEP}
                    y={LABEL_HEIGHT + row * STEP}
                    width={CELL}
                    height={CELL}
                    rx={2}
                    fill={heatmapCellColor(cell.tier)}
                    data-tier={cell.tier}
                  >
                    <title>{`${cell.date.toDateString()} · ${formatBytes(cell.totalBytes)}`}</title>
                  </rect>
                );
              })}
            </svg>
            <div className="mt-4 grid grid-cols-7 gap-1.5">
              {DAY_NAMES.map((name) => (
                <span
                  key={name}
                  className="text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}