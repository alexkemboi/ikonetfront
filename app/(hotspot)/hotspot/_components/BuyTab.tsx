"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, SortAsc, Filter } from "lucide-react";
import { HotspotPackage } from "@/lib/types/hotspot";
import PackageCard from "./PackageCard";
import CheckoutModal from "./CheckoutModal";
import type { PendingHotspotPurchase } from "@/lib/types/hotspot";
import { PENDING_HOTSPOT_PURCHASE_KEY } from "@/lib/hotspotPublicClient";


interface BuyTabProps {
  packages: HotspotPackage[];
  companyCode?: string | null;
  onCompanyResolved?: (companyCode?: string | null) => void;
  onBack: () => void;
  clientMac?: string;
  redirectClientMac?: string;
  clientIp?: string;
  /** RouterOS $(identity) of the serving router (redirect `identity`/`router`). */
  routerIdentity?: string;
}

type SortBy = "price-asc" | "price-desc" | "data-asc" | "data-desc";

export default function BuyTab({ packages, companyCode, onCompanyResolved, onBack, clientMac, redirectClientMac, clientIp, routerIdentity }: BuyTabProps) {
 const [searchQuery, setSearchQuery] = useState("");
 const [sortBy, setSortBy] = useState<SortBy>("price-asc");
 const [selectedPackage, setSelectedPackage] = useState<HotspotPackage | null>(null);
 const [showCheckout, setShowCheckout] = useState(false);
 const [pendingPurchase, setPendingPurchase] = useState<PendingHotspotPurchase | null>(null);

 useEffect(() => {
   try {
     const stored = window.sessionStorage.getItem(PENDING_HOTSPOT_PURCHASE_KEY);
     if (!stored) return;
     const parsed = JSON.parse(stored) as PendingHotspotPurchase;
     if (parsed.voucherCode && parsed.sessionId !== undefined && parsed.startedAt) {
       setPendingPurchase(parsed);
       setShowCheckout(true);
     }
   } catch {
     window.sessionStorage.removeItem(PENDING_HOTSPOT_PURCHASE_KEY);
   }
 }, []);

    // Filter and sort packages
    const filteredAndSorted = useMemo(() => {
        const result = packages.filter((pkg) =>
            pkg.packageName.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case "price-asc":
                  return compareMoneyStrings(a.price, b.price);
                case "price-desc":
                  return compareMoneyStrings(b.price, a.price);
                case "data-asc":
                    return (a.speedDownload ?? 0) - (b.speedDownload ?? 0);
                case "data-desc":
                    return (b.speedDownload ?? 0) - (a.speedDownload ?? 0);
                default:
                    return 0;
            }
        });

 return result;
 }, [packages, searchQuery, sortBy]);

 const handleSelect = (pkg: HotspotPackage) => {
 setSelectedPackage(pkg);
 setShowCheckout(true);
 };

 return (
 <div className="w-full max-w-2xl mx-auto space-y-4">
 {/* Header with back button */}
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-lg font-normal text-foreground">Available Packages</h2>
 <p className="text-xs text-muted-foreground mt-0.5">
 {filteredAndSorted.length} package{filteredAndSorted.length !== 1 ? "s" : ""} available
 </p>
 </div>
 <button
 onClick={onBack}
 className="text-sm font-medium text-primary hover:underline"
 >
 ← Back
 </button>
 </div>

 {/* Search and filters */}
 <div className="space-y-3">
 {/* Search bar */}
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input
 type="text"
 placeholder="Search packages..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
 />
 </div>

 {/* Sort controls */}
 <div className="flex gap-2 flex-wrap">
 <button
 onClick={() => setSortBy(sortBy === "price-asc" ? "price-desc" : "price-asc")}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sortBy.startsWith("price")
 ? "bg-primary text-primary-foreground"
 : "bg-secondary text-foreground border border-border hover:bg-secondary/80"
 }`}
 >
 <SortAsc className="w-3.5 h-3.5" />
 Price {sortBy === "price-asc" ? "↑" : "↓"}
 </button>

 <button
 onClick={() => setSortBy(sortBy === "data-asc" ? "data-desc" : "data-asc")}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sortBy.startsWith("data")
 ? "bg-primary text-primary-foreground"
 : "bg-secondary text-foreground border border-border hover:bg-secondary/80"
 }`}
 >
 <Filter className="w-3.5 h-3.5" />
 Data {sortBy === "data-asc" ? "↑" : "↓"}
 </button>
 </div>
 </div>

 {/* Package list */}
 <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
 {filteredAndSorted.length > 0 ? (
 filteredAndSorted.map((pkg) => (
 <PackageCard
 key={pkg.idxno}
 pkg={pkg}
 onSelect={handleSelect}
 />
 ))
 ) : (
 <div className="text-center py-8">
 <p className="text-sm text-muted-foreground">
 No packages found matching your search.
 </p>
 </div>
 )}
 </div>

{/* Checkout Modal */}
  {showCheckout && (selectedPackage || pendingPurchase) && (
    <CheckoutModal
      package={selectedPackage ?? undefined}
      pendingPurchase={pendingPurchase ?? undefined}
      companyCode={companyCode}
      onCompanyResolved={onCompanyResolved}
      clientMac={clientMac}
      redirectClientMac={redirectClientMac}
      clientIp={clientIp}
      routerIdentity={routerIdentity}
      onClose={() => {
        setShowCheckout(false);
        setSelectedPackage(null);
      }}
      onPendingPurchase={setPendingPurchase}
    />
  )}
 </div>
 );
}
