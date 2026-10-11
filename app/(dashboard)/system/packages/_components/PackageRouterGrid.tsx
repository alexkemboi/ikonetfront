"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, MapPin, Router as RouterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { CompanyPackageAvailability, PackageAvailability } from "@/actions/packages";
import { offerPackageOnAllRoutersAction, togglePackageRouterAction } from "@/actions/packages";

/** Is the package sold on this router, given its scope and switched-on routers? */
export function isOffered(pkg: PackageAvailability, routerId: number): boolean {
  return pkg.routerScope === "ALL" || pkg.routerIds.includes(routerId);
}

/** "All routers", "No router" or "2 of 3 routers". */
export function soldOnLabel(pkg: PackageAvailability, routerCount: number): string {
  if (pkg.routerScope === "ALL") return "All routers";
  if (pkg.routerIds.length === 0) return "No router";
  return `${pkg.routerIds.length} of ${routerCount} router${routerCount === 1 ? "" : "s"}`;
}

/**
 * Where each package is sold: one row per package, one column per router of the
 * company, a switch in every cell. A package that is on for every router is also
 * offered on routers added later; switching one router off makes it site-specific.
 */
export default function PackageRouterGrid({
  availability,
  canEdit,
  onChanged,
}: {
  availability: CompanyPackageAvailability;
  canEdit: boolean;
  onChanged?: (pkg: PackageAvailability) => void;
}) {
  const routers = availability.routers;
  const [rows, setRows] = useState<PackageAvailability[]>(availability.packages);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [onlySiteSpecific, setOnlySiteSpecific] = useState(false);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (p) =>
        (!onlySiteSpecific || p.routerScope === "SELECTED") &&
        (!q || p.packageName.toLowerCase().includes(q) || (p.packageCategory ?? "").toLowerCase().includes(q))
    );
  }, [rows, search, onlySiteSpecific]);

  const apply = (updated: PackageAvailability) => {
    setRows((prev) => prev.map((p) => (p.idxno === updated.idxno ? { ...p, ...updated } : p)));
    onChanged?.(updated);
  };

  const toggle = async (pkg: PackageAvailability, routerId: number, offered: boolean) => {
    setBusy(`${pkg.idxno}:${routerId}`);
    const res = await togglePackageRouterAction(pkg.idxno, routerId, offered);
    setBusy(null);
    if (!res.success || !res.data) {
      toast.error(res.message);
      return;
    }
    apply(res.data);
    const router = routers.find((r) => r.id === routerId)?.name ?? "the router";
    toast.success(`${pkg.packageName} is ${offered ? "now sold" : "no longer sold"} at ${router}.`);
  };

  const offerEverywhere = async (pkg: PackageAvailability) => {
    setBusy(`${pkg.idxno}:all`);
    const res = await offerPackageOnAllRoutersAction(pkg.idxno);
    setBusy(null);
    if (!res.success || !res.data) {
      toast.error(res.message);
      return;
    }
    apply(res.data);
    toast.success(`${pkg.packageName} is sold on every router again.`);
  };

  if (routers.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        This company has no active MikroTik router yet. Link a router first; every package is then sold on it until you
        switch it off here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Switch a package off for a router to stop showing and selling it on that router&apos;s hotspot page. A package
        that is on for <span className="font-medium text-foreground">every</span> router is also sold on routers you
        add later; a site-specific package must be switched on for a new router by hand. Only active, approved packages
        are sold anywhere.
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search packages…"
          aria-label="Search packages"
          className="max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={onlySiteSpecific} onCheckedChange={setOnlySiteSpecific} aria-label="Only site-specific packages" />
          Only site-specific packages
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 z-10 min-w-56 bg-card px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                Package
              </th>
              {routers.map((r) => (
                <th key={r.id} className="min-w-36 px-4 py-3 text-center align-bottom">
                  <div className="flex items-center justify-center gap-1.5 text-foreground">
                    <RouterIcon className="h-3.5 w-3.5" />
                    <span className="font-medium">{r.name}</span>
                    <span
                      title={r.online ? "Online" : "Offline"}
                      className={cn("h-2 w-2 rounded-full", r.online ? "bg-emerald-500" : "bg-zinc-400")}
                    />
                  </div>
                  {r.location && (
                    <div className="mt-0.5 flex items-center justify-center gap-1 text-xs font-normal text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {r.location}
                    </div>
                  )}
                </th>
              ))}
              <th className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Sold on</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={routers.length + 2} className="px-4 py-8 text-center text-muted-foreground">
                  No packages match.
                </td>
              </tr>
            )}
            {visible.map((pkg) => {
              const sellable = pkg.active && pkg.approved;
              return (
                <tr key={pkg.idxno} className={cn("border-b border-border last:border-0", !sellable && "opacity-60")}>
                  <td className="sticky left-0 z-10 bg-card px-4 py-3">
                    <p className="font-medium text-foreground">{pkg.packageName}</p>
                    <p className="text-xs text-muted-foreground">
                      {pkg.packageCategory} · KES {pkg.price}
                      {!pkg.active ? " · inactive" : !pkg.approved ? " · not approved" : ""}
                    </p>
                  </td>
                  {routers.map((r) => {
                    const key = `${pkg.idxno}:${r.id}`;
                    const on = isOffered(pkg, r.id);
                    return (
                      <td key={r.id} className="px-4 py-3 text-center">
                        {busy === key ? (
                          <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Switch
                            checked={on}
                            disabled={!canEdit || busy !== null}
                            onCheckedChange={(checked) => toggle(pkg, r.id, checked)}
                            aria-label={`${pkg.packageName} at ${r.name}`}
                          />
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        pkg.routerScope === "ALL"
                          ? "bg-emerald-500/15 text-emerald-600"
                          : pkg.routerIds.length === 0
                            ? "bg-rose-500/15 text-rose-500"
                            : "bg-amber-500/15 text-amber-600"
                      )}
                    >
                      {soldOnLabel(pkg, routers.length)}
                    </span>
                    {canEdit && pkg.routerScope === "SELECTED" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-7 px-2 text-xs"
                        disabled={busy !== null}
                        onClick={() => offerEverywhere(pkg)}
                      >
                        {busy === `${pkg.idxno}:all` ? <Loader2 className="h-3 w-3 animate-spin" /> : "Sell everywhere"}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
