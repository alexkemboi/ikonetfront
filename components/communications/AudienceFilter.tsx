"use client";

import { MapPin, Router as RouterIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AudienceKind, AudienceNode, AudienceScope, AudienceTree } from "@/actions/communications";
import { ALL_KINDS, KIND_LABEL, headcount, options, pick } from "@/lib/communications/audience";

const ALL = "all";

const WINDOWS: { value: string; label: string; days: number | null }[] = [
  { value: "any", label: "Any time", days: null },
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "90", label: "Last 90 days", days: 90 },
  { value: "365", label: "Last year", days: 365 },
];

function Level({
  label,
  value,
  nodes,
  kinds,
  onChange,
  emptyText,
}: {
  label: string;
  value: number | undefined;
  nodes: AudienceNode[];
  kinds: AudienceKind[];
  onChange: (id: number | null) => void;
  emptyText: string;
}) {
  return (
    <div className="space-y-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <Select value={value === undefined ? ALL : String(value)} onValueChange={(v) => onChange(v === ALL ? null : Number(v))}>
        <SelectTrigger className="h-9 text-xs" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{nodes.length === 0 ? emptyText : `All ${label.toLowerCase()}s`}</SelectItem>
          {nodes.map((n) => (
            <SelectItem key={n.id} value={String(n.id)}>
              {n.name}
              {!n.active ? " (inactive)" : ""} · {headcount(n, kinds).toLocaleString()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Narrows the customers of a message to a part of the company's network: region, location,
 * station, MikroTik, and the kinds of customer. Each picker shows how many people a place holds.
 */
export function AudienceFilter({
  tree,
  scope,
  onChange,
  disabled,
}: {
  tree: AudienceTree;
  scope: AudienceScope;
  onChange: (scope: AudienceScope) => void;
  disabled?: boolean;
}) {
  const o = options(tree, scope);
  const kinds = scope.kinds;
  const toggleKind = (kind: AudienceKind) => {
    const current = kinds.length === 0 ? ALL_KINDS : kinds;
    const next = current.includes(kind) ? current.filter((k) => k !== kind) : [...current, kind];
    onChange({ ...scope, kinds: next.length === ALL_KINDS.length ? [] : next });
  };
  const recency = WINDOWS.find((w) => w.days === scope.hotspotWithinDays)?.value ?? "any";
  const hotspotOn = kinds.length === 0 || kinds.includes("HOTSPOT");

  return (
    <fieldset disabled={disabled} className="space-y-3 rounded-xl border border-border p-4">
      <legend className="flex items-center gap-1.5 px-1 text-xs font-medium text-foreground">
        <MapPin className="h-3.5 w-3.5" /> Where
      </legend>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Level label="Region" value={scope.regionIds[0]} nodes={o.regions} kinds={kinds}
          emptyText="No regions set up" onChange={(id) => onChange(pick(scope, "region", id))} />
        <Level label="Location" value={scope.locationIds[0]} nodes={o.locations} kinds={kinds}
          emptyText="No locations here" onChange={(id) => onChange(pick(scope, "location", id))} />
        <Level label="Station" value={scope.stationIds[0]} nodes={o.stations} kinds={kinds}
          emptyText="No stations here" onChange={(id) => onChange(pick(scope, "station", id))} />
        <Level label="MikroTik" value={scope.deviceIds[0]} nodes={o.devices} kinds={kinds}
          emptyText="No MikroTiks here" onChange={(id) => onChange(pick(scope, "device", id))} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
          <RouterIcon className="h-3.5 w-3.5" /> Who
        </span>
        {ALL_KINDS.map((kind) => {
          const on = kinds.length === 0 || kinds.includes(kind);
          return (
            <button key={kind} type="button" aria-pressed={on} onClick={() => toggleKind(kind)}
              className={cn("rounded-full border px-3 py-1 text-xs transition-colors",
                on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50")}>
              {KIND_LABEL[kind]}
            </button>
          );
        })}
        {hotspotOn && (
          <Select value={recency} onValueChange={(v) => onChange({ ...scope,
            hotspotWithinDays: WINDOWS.find((w) => w.value === v)?.days ?? null })}>
            <SelectTrigger className="h-7 w-auto gap-1 text-xs" aria-label="Hotspot buyers who bought">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WINDOWS.map((w) => (
                <SelectItem key={w.value} value={w.value}>Hotspot: bought {w.label.toLowerCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {tree.unplaced > 0 && scope.regionIds.length + scope.locationIds.length + scope.stationIds.length + scope.deviceIds.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {tree.unplaced.toLocaleString()} customer(s) are on no known station and are only reached with the whole company.
        </p>
      )}
    </fieldset>
  );
}
