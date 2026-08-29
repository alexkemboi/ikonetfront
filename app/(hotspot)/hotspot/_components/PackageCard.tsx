"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { HotspotPackage } from "@/lib/types/hotspot";

interface PackageCardProps {
 pkg: HotspotPackage;
 onSelect: (pkg: HotspotPackage) => void;
}

export default function PackageCard({ pkg, onSelect }: PackageCardProps) {
 const [isExpanded, setIsExpanded] = useState(false);

 const speedLabel =
 pkg.speedDownload >= 1000 ? "Unlimited" : `${pkg.speedDownload} Mbps`;

 return (
 <div
 className="border border-border rounded-lg overflow-hidden bg-card transition-all duration-200 hover:border-primary/50"
 role="button"
 tabIndex={0}
 onKeyDown={(e) => {
 if (e.key === "Enter") onSelect(pkg);
 if (e.key === " ") setIsExpanded(!isExpanded);
 }}
 aria-label={`${pkg.packageName} package`}
 >
 {/* Main row - always visible */}
 <div className="px-4 py-3 flex items-center justify-between gap-4">
 {/* Left: Package info (compact) */}
 <div className="flex-1 min-w-0 ">
 <h3 className="text-sm font-semibold text-foreground truncate">
 {pkg.packageName}
 </h3>
 <div className="text-xs text-muted-foreground mt-4.5 md:mt-0.5 flex items-center gap-2 ">
 <div className="flex items-center gap-1">
 <ArrowUp className="w-4 h-4 text-primary" />
 {pkg.speedUpload} Mbps 
 </div>

 <div className="flex items-center gap-1">
 <ArrowDown className="w-4 h-4 text-green-700" />
 {pkg.speedDownload} Mbps
 </div>


 {/* <div className="flex items-center gap-1">
 <Clock className="w-4 h-4 text-primary" />
 { pkg.validityValue } {pkg.validityType}
 </div> */}
 
 
 </div>
 </div>

 {/* Center: Price */}
 <div className="text-right shrink-0 flex items-center justify-between sm:justify-end">
 <span className="text-lg font-bold text-primary">
 KES {pkg.price.toLocaleString()}
 </span>
 </div>

 {/* Right: Expand/Collapse + Select */}
 <div className="shrink-0 flex items-center gap-2">
 <button
 onClick={() => setIsExpanded(!isExpanded)}
 className="p-1 hover:bg-secondary rounded transition-colors"
 aria-label="Toggle details"
 >
 {isExpanded ? (
 <ChevronUp className="w-4 h-4 text-muted-foreground" />
 ) : (
 <ChevronDown className="w-4 h-4 text-muted-foreground" />
 )}
 </button>

 <button
 onClick={() => onSelect(pkg)}
 className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded transition-opacity hover:opacity-90 active:opacity-75 whitespace-nowrap"
 >
 Select
 </button>
 </div>
 </div>

 {/* Expanded details */}
 {isExpanded && (
 <div className="border-t border-border px-4 py-3 bg-secondary/30 space-y-2 text-sm">
 <div className="flex justify-between items-start">
 <span className="text-muted-foreground">Download Speed:</span>
 <span className="font-medium text-foreground">{speedLabel}</span>
 </div>
 <div className="flex justify-between items-start">
 <span className="text-muted-foreground">Data Amount:</span>
 <span className="font-medium text-foreground">{pkg.speedDownload} GB</span>
 </div>
 <div className="flex justify-between items-start">
 <span className="text-muted-foreground">Upload Speed:</span>
 <span className="font-medium text-foreground">{pkg.speedUpload} Mbps</span>
 </div>
 <div className="flex justify-between items-start">
 <span className="text-muted-foreground">Validity:</span>
 <span className="font-medium text-foreground">
 {pkg.validityValue} {pkg.validityType}
 </span>
 </div>
 {/* {pkg.description && (
 <div className="pt-2 border-t border-border">
 <p className="text-muted-foreground">{pkg.description}</p>
 </div>
 )} */}
 </div>
 )}
 </div>
 );
}
