"use client";

import { HotspotPackage } from "@/lib/types/hotspot";

interface PackageCardProps {
 pkg: HotspotPackage;
 onSelect: (pkg: HotspotPackage) => void;
}

/** One package, in plain words: name, how long it lasts, how many devices, price. */
export default function PackageCard({ pkg, onSelect }: PackageCardProps) {
	const validity = pkg.validityValue && pkg.validityType ? `${pkg.validityValue} ${pkg.validityType}` : null;
	const devices = pkg.maxDevices && pkg.maxDevices > 1 ? `${pkg.maxDevices} devices` : null;
	const details = [validity, devices].filter(Boolean).join(" · ");

	return (
		<div
			className="border border-border rounded-lg overflow-hidden bg-card transition-all duration-200 hover:border-primary/50"
			role="button"
			tabIndex={0}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") onSelect(pkg);
			}}
			aria-label={`${pkg.packageName} package, KES ${pkg.price}`}
		>
			<div className="px-4 py-3 flex items-center justify-between gap-4">
				<div className="flex-1 min-w-0">
					<h3 className="text-sm font-normal text-foreground truncate">{pkg.packageName}</h3>
					{details && <p className="text-xs text-muted-foreground mt-0.5">{details}</p>}
				</div>

				<span className="text-lg font-bold text-primary shrink-0">KES {pkg.price}</span>

				<button
					onClick={() => onSelect(pkg)}
					className="shrink-0 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded transition-opacity hover:opacity-90 whitespace-nowrap"
				>
					Select
				</button>
			</div>
		</div>
	);
}
