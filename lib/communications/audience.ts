import type { AudienceKind, AudienceNode, AudienceScope, AudienceTree } from "@/actions/communications";

export const ALL_KINDS: AudienceKind[] = ["PPPOE", "HOTSPOT", "ACCOUNT"];

export const KIND_LABEL: Record<AudienceKind, string> = {
  PPPOE: "PPPoE subscribers",
  HOTSPOT: "Hotspot buyers",
  ACCOUNT: "Customer accounts",
};

export const EMPTY_SCOPE: AudienceScope = {
  regionIds: [],
  locationIds: [],
  stationIds: [],
  deviceIds: [],
  kinds: [],
  hotspotWithinDays: null,
};

/** People a place holds of the chosen kinds. */
export function headcount(node: AudienceNode, kinds: AudienceKind[]): number {
  const k = kinds.length === 0 ? ALL_KINDS : kinds;
  return (k.includes("PPPOE") ? node.pppoe : 0) + (k.includes("HOTSPOT") ? node.hotspot : 0)
    + (k.includes("ACCOUNT") ? node.accounts : 0);
}

/**
 * The places that can be picked at each level, given what is picked above: locations of the
 * chosen region, stations of the chosen location (or region), MikroTiks of the chosen station.
 */
export function options(tree: AudienceTree, scope: AudienceScope) {
  const region = scope.regionIds[0];
  const location = scope.locationIds[0];
  const station = scope.stationIds[0];
  const locations = tree.locations.filter((l) => region === undefined || l.parentId === region);
  const locationIds = new Set(locations.map((l) => l.id));
  const stations = tree.stations.filter((s) =>
    location !== undefined ? s.parentId === location : region === undefined || (s.parentId !== null && locationIds.has(s.parentId))
  );
  const stationIds = new Set(stations.map((s) => s.id));
  const devices = tree.devices.filter((d) =>
    station !== undefined
      ? d.parentId === station
      : region === undefined && location === undefined
        ? true
        : d.parentId !== null && stationIds.has(d.parentId)
  );
  return { regions: tree.regions, locations, stations, devices };
}

/** Picking a place clears the levels below it, which may no longer belong to it. */
export function pick(scope: AudienceScope, level: "region" | "location" | "station" | "device", id: number | null): AudienceScope {
  const one = id === null ? [] : [id];
  switch (level) {
    case "region":
      return { ...scope, regionIds: one, locationIds: [], stationIds: [], deviceIds: [] };
    case "location":
      return { ...scope, locationIds: one, stationIds: [], deviceIds: [] };
    case "station":
      return { ...scope, stationIds: one, deviceIds: [] };
    case "device":
      return { ...scope, deviceIds: one };
  }
}

/** "WESTGATE · ADRINOLD-WESTLANDS · PPPoE subscribers" — what the scope covers, in words. */
export function describeScope(tree: AudienceTree | null, scope: AudienceScope): string {
  const name = (list: AudienceNode[] | undefined, id: number | undefined) =>
    id === undefined ? null : list?.find((n) => n.id === id)?.name ?? `#${id}`;
  const deepest =
    name(tree?.devices, scope.deviceIds[0]) ??
    name(tree?.stations, scope.stationIds[0]) ??
    name(tree?.locations, scope.locationIds[0]) ??
    name(tree?.regions, scope.regionIds[0]) ??
    "Whole company";
  const kinds = scope.kinds.length === 0 || scope.kinds.length === ALL_KINDS.length
    ? "all customers"
    : scope.kinds.map((k) => KIND_LABEL[k]).join(", ");
  const recent = scope.hotspotWithinDays ? ` (hotspot: last ${scope.hotspotWithinDays} days)` : "";
  return `${deepest} · ${kinds}${recent}`;
}
