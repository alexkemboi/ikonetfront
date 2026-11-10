"use client";

import { HotspotPackage } from "@/lib/types/hotspot";

interface PackageCardProps {
  pkg: HotspotPackage;
  onSelect: (pkg: HotspotPackage) => void;
}

/** One package as a small tile, so a whole price list fits on one phone screen: name, length, price. */
export default function PackageCard({ pkg, onSelect }: PackageCardProps) {
  const validity = pkg.validityValue && pkg.validityType ? `${pkg.validityValue} ${pkg.validityType}` : null;
  const devices = pkg.maxDevices && pkg.maxDevices > 1 ? `${pkg.maxDevices} devices` : null;
  const details = [validity, devices].filter(Boolean).join(" · ");

  return (
    <div
      className="flex cursor-pointer flex-col gap-1 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/60"
      onClick={() => onSelect(pkg)}
    >
      <h3 className="truncate text-sm font-medium text-foreground" title={pkg.packageName}>{pkg.packageName}</h3>
      {details && <p className="truncate text-xs text-muted-foreground">{details}</p>}
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-base font-bold text-primary">KES {pkg.price}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(pkg);
          }}
          className="rounded bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          Select
        </button>
      </div>
    </div>
  );
}
