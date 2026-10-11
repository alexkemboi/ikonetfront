import type { ReactNode } from "react";

export interface BarListRow {
  key: string;
  label: ReactNode;
  detail?: ReactNode;
  value: number;
  display: ReactNode;
}

/**
 * Ranked or ordered values as labelled horizontal bars on one scale (the largest value
 * fills the row). Every bar carries its own label and figure, so nothing depends on colour.
 */
export function BarList({ rows, ordered = false }: { rows: BarListRow[]; ordered?: boolean }) {
  const max = Math.max(0, ...rows.map((row) => row.value));
  const List = ordered ? "ol" : "ul";
  return (
    <List className="space-y-3">
      {rows.map((row, index) => (
        <li key={row.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-baseline gap-2">
              {ordered && <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">{index + 1}</span>}
              <span className="min-w-0 truncate text-foreground">{row.label}</span>
              {row.detail && <span className="shrink-0 text-xs text-muted-foreground">{row.detail}</span>}
            </span>
            <span className="shrink-0 font-medium tabular-nums text-foreground">{row.display}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full"
              style={{ width: `${max > 0 ? Math.max(0, (row.value / max) * 100) : 0}%`, background: "var(--viz-1)" }}
            />
          </div>
        </li>
      ))}
    </List>
  );
}
