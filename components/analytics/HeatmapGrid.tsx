import { WEEKDAYS } from "@/lib/analytics/format";
import type { Heatmap } from "@/lib/types/analytics";

const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21];
const STEPS = 5;

/** Which of the five steps a value falls in; 0 is "nothing here". */
export function heatStep(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0;
  return Math.min(STEPS, Math.max(1, Math.ceil((count / max) * STEPS)));
}

/**
 * Weekday by hour of day, one cell per hour (labels every three hours). One hue: the
 * more there is, the stronger the cell. Each cell names its own value for hover and
 * for screen readers.
 */
export function HeatmapGrid({ heatmap, unit }: { heatmap: Heatmap; unit: { one: string; many: string } }) {
  const byCell = new Map(heatmap.cells.map((cell) => [`${cell.isoWeekday}-${cell.hour}`, cell.count]));
  const describe = (count: number) => `${count.toLocaleString("en-US")} ${count === 1 ? unit.one : unit.many}`;

  const columns = { gridTemplateColumns: "2rem repeat(24, minmax(0, 1fr))" };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[440px] space-y-[2px] text-[10px] text-muted-foreground">
        <div className="grid gap-[2px] pb-0.5" style={columns} aria-hidden="true">
          <span />
          {Array.from({ length: 24 }, (_, hour) => (
            <span key={hour} className="whitespace-nowrap tabular-nums">
              {HOUR_TICKS.includes(hour) ? String(hour).padStart(2, "0") : ""}
            </span>
          ))}
        </div>
        {WEEKDAYS.map((weekday, index) => (
          <div key={weekday} className="grid items-center gap-[2px]" style={columns}>
            <span>{weekday}</span>
            {Array.from({ length: 24 }, (_, hour) => {
              const count = byCell.get(`${index + 1}-${hour}`) ?? 0;
              const label = `${weekday} ${String(hour).padStart(2, "0")}:00 · ${describe(count)}`;
              return (
                <span
                  key={hour}
                  title={label}
                  className="h-5 rounded-[3px]"
                  style={{ background: `var(--viz-heat-${heatStep(count, heatmap.max)})` }}
                >
                  <span className="sr-only">{label}</span>
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>Fewer</span>
        {[1, 2, 3, 4, 5].map((step) => (
          <span key={step} className="size-3 rounded-[3px]" style={{ background: `var(--viz-heat-${step})` }} />
        ))}
        <span>More</span>
        <span className="ml-3">Peak: {describe(heatmap.max)}</span>
      </div>
    </div>
  );
}
