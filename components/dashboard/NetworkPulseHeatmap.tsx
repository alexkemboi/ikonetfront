import React from "react";
import { HeatmapSummary } from "@/lib/types/dashboard";

interface Props {
 heatmap: HeatmapSummary;
}

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function NetworkPulseHeatmap({ heatmap }: Props) {
 const getCellColor = (intensity: number) => {
 switch (intensity) {
 case 4:
 return "bg-amber-500 shadow-sm shadow-amber-500/50"; // Peak busy
 case 3:
 return "bg-amber-600/80";
 case 2:
 return "bg-amber-800/60";
 case 1:
 return "bg-amber-950/50";
 default:
 return "bg-muted/40"; // Quiet
 }
 };

 return (
 <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
 <div className="flex flex-wrap items-center justify-between border-b border-border pb-4">
 <div>
 <h2 className="text-lg font-semibold text-foreground">Your network&apos;s pulse</h2>
 <p className="text-xs text-muted-foreground">Last 7 days · day × hour · by traffic volume</p>
 </div>

 {/* Legend */}
 <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
 <span>Quiet</span>
 <div className="flex items-center gap-1">
 <span className="h-3 w-3 rounded bg-amber-950/60" />
 <span className="h-3 w-3 rounded bg-amber-800/60" />
 <span className="h-3 w-3 rounded bg-amber-600/80" />
 <span className="h-3 w-3 rounded bg-amber-500" />
 </div>
 <span>Busy</span>
 </div>
 </div>

 {/* 7 x 24 Matrix Grid */}
 <div className="mt-6 overflow-x-auto">
 <div className="min-w-[680px]">
 {/* Hour Headers */}
 <div className="grid grid-cols-[40px_repeat(24,1fr)] gap-1.5 text-center text-[10px] font-mono text-muted-foreground">
 <span />
 {HOURS.map((h) => (
 <span key={h}>{h % 6 === 0 ? h : ""}</span>
 ))}
 </div>

 {/* Rows */}
 <div className="mt-2 space-y-1.5">
 {DAYS.map((dayName, dayIndex) => (
 <div key={dayName} className="grid grid-cols-[40px_repeat(24,1fr)] items-center gap-1.5">
 <span className="text-[11px] font-mono font-medium text-muted-foreground">{dayName}</span>
 {HOURS.map((hour) => {
 const cell = heatmap.cells.find(
 (c) => c.dayOfWeek === dayIndex && c.hourOfDay === hour
 );
 const intensity = cell ? cell.intensity : 0;
 return (
 <div
 key={hour}
 title={`${dayName} ${hour}:00 - ${cell ? cell.volumeGb : 0} GB`}
 className={`h-5 w-full rounded-sm transition hover:scale-110 hover:border hover:border-amber-400 ${getCellColor(
 intensity
 )}`}
 />
 );
 })}
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Summary Footer Cards */}
 <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-6 sm:grid-cols-4">
 <div>
 <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
 PEAK HOUR
 </span>
 <div className="mt-1 font-mono text-sm font-semibold text-foreground">
 {heatmap.peakHour}
 </div>
 </div>

 <div>
 <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
 QUIETEST
 </span>
 <div className="mt-1 font-mono text-sm font-semibold text-foreground">
 {heatmap.quietestHour}
 </div>
 </div>

 <div>
 <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
 WEEKDAY AVG
 </span>
 <div className="mt-1 font-mono text-sm font-semibold text-foreground">
 {heatmap.weekdayAvgGb}
 </div>
 </div>

 <div>
 <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
 WEEKEND AVG
 </span>
 <div className="mt-1 font-mono text-sm font-semibold text-foreground">
 {heatmap.weekendAvgGb}
 </div>
 </div>
 </div>
 </div>
 );
}