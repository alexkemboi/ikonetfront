"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Search, SortAsc } from "lucide-react";
import { HotspotPackage } from "@/lib/types/hotspot";
import PackageCard from "./PackageCard";
import CheckoutModal from "./CheckoutModal";
import type { PendingHotspotPurchase } from "@/lib/types/hotspot";
import { PENDING_HOTSPOT_PURCHASE_KEY } from "@/lib/hotspotPublicClient";


interface BuyTabProps {
  packages: HotspotPackage[];
  companyCode?: string | null;
  onCompanyResolved?: (companyCode?: string | null) => void;
  /** No longer shown (the tabs above switch to vouchers); kept so callers need not change. */
  onBack?: () => void;
  clientMac?: string;
  redirectClientMac?: string;
  clientIp?: string;
  /** RouterOS $(identity) of the serving router (redirect `identity`/`router`). */
  routerIdentity?: string;
}

type SortBy = "price-asc" | "price-desc";

/** Reads the parked purchase, discarding anything incomplete or corrupt. */
function readPendingPurchase(): PendingHotspotPurchase | null {
  try {
    const stored = window.sessionStorage.getItem(PENDING_HOTSPOT_PURCHASE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PendingHotspotPurchase;
    if (parsed.voucherCode && parsed.sessionId !== undefined && parsed.startedAt) {
      return parsed;
    }
    return null;
  } catch {
    // corrupt, or storage blocked by the phone's sign-in window: forget it either way
    try { window.sessionStorage.removeItem(PENDING_HOTSPOT_PURCHASE_KEY); } catch { /* storage blocked */ }
    return null;
  }
}

// useSyncExternalStore compares snapshots by identity: a freshly parsed object on
// every call reads as "the store changed" and re-renders until React gives up
// ("Maximum update depth exceeded"). Re-parse only when the stored text changes.
let snapshotSource: string | null = null;
let snapshot: PendingHotspotPurchase | null = null;

function getPendingPurchase(): PendingHotspotPurchase | null {
  let stored: string | null = null;
  try {
    stored = window.sessionStorage.getItem(PENDING_HOTSPOT_PURCHASE_KEY);
  } catch {
    stored = null;
  }
  if (stored !== snapshotSource) {
    snapshotSource = stored;
    snapshot = readPendingPurchase();
  }
  return snapshot;
}

/** Server render: nothing parked yet, so the modal starts closed. */
function getServerPendingPurchase(): PendingHotspotPurchase | null {
  return null;
}

function subscribeToPendingPurchase(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(PENDING_HOTSPOT_PURCHASE_KEY, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(PENDING_HOTSPOT_PURCHASE_KEY, onChange);
  };
}

/**
 * Prices arrive as decimal strings (e.g. "1,250.00"), so numeric comparison has
 * to go through Number() — and unparseable values sort last rather than NaN.
 */
function compareMoneyStrings(a: string, b: string): number {
  const left = Number(String(a).replace(/[^0-9.-]/g, ""));
  const right = Number(String(b).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(left)) return Number.isFinite(right) ? 1 : 0;
  if (!Number.isFinite(right)) return -1;
  return left - right;
}

export default function BuyTab({ packages, companyCode, onCompanyResolved, clientMac, redirectClientMac, clientIp, routerIdentity }: BuyTabProps) {
 const [searchQuery, setSearchQuery] = useState("");
 const [sortBy, setSortBy] = useState<SortBy>("price-asc");
 const [selectedPackage, setSelectedPackage] = useState<HotspotPackage | null>(null);
const [showCheckout, setShowCheckout] = useState(false);
  // Closed by the customer while a purchase is still parked: the box goes away (Close used
  // to do nothing in that state) and the parked purchase is picked up again on the next load.
  const [dismissed, setDismissed] = useState(false);
  // The parked purchase was just cleared (connected, or M-Pesa said it was not paid): keep
  // the box open so its result stays on screen until the customer closes it.
  const [keepOpen, setKeepOpen] = useState(false);

  // A purchase interrupted by a redirect is parked in sessionStorage by the
  // checkout modal. Read it through useSyncExternalStore so the server snapshot
  // stays null (no hydration mismatch) and the client picks it up on mount,
  // rather than setting state from an effect.
  const pendingPurchase = useSyncExternalStore(
    subscribeToPendingPurchase,
    getPendingPurchase,
    getServerPendingPurchase
  );

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
                default:
                    return 0;
            }
        });

 return result;
 }, [packages, searchQuery, sortBy]);

 const handleSelect = (pkg: HotspotPackage) => {
 setSelectedPackage(pkg);
 setShowCheckout(true);
 setDismissed(false);
 setKeepOpen(false);
 };

 return (
 <div className="w-full max-w-2xl mx-auto space-y-3">
  {/* Search and sort only when the list is long; a short list is all on screen */}
  {packages.length > 9 && (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search packages..."
          aria-label="Search packages"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <button
        type="button"
        onClick={() => setSortBy(sortBy === "price-asc" ? "price-desc" : "price-asc")}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-secondary text-foreground border border-border hover:bg-secondary/80"
      >
        <SortAsc className="w-3.5 h-3.5" />
        Price {sortBy === "price-asc" ? "↑" : "↓"}
      </button>
    </div>
  )}

  {/* Packages: two across on a phone, three on wider screens */}
  {filteredAndSorted.length > 0 ? (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {filteredAndSorted.map((pkg) => (
        <PackageCard key={pkg.idxno} pkg={pkg} onSelect={handleSelect} />
      ))}
    </div>
  ) : (
    <p className="py-8 text-center text-sm text-muted-foreground">
      {packages.length === 0 ? "No packages are on sale here right now." : "No packages found matching your search."}
    </p>
  )}

{/* Checkout Modal */}
  {!dismissed && (showCheckout || pendingPurchase || keepOpen) && (selectedPackage || pendingPurchase || keepOpen) && (
    <CheckoutModal
      package={selectedPackage ?? undefined}
      // a package the customer has just chosen starts a new purchase; a parked one is
      // resumed only when the page was opened without choosing anything
      pendingPurchase={showCheckout ? undefined : pendingPurchase ?? undefined}
      companyCode={companyCode}
      onCompanyResolved={onCompanyResolved}
      clientMac={clientMac}
      redirectClientMac={redirectClientMac}
      clientIp={clientIp}
      routerIdentity={routerIdentity}
      onClose={() => {
        setShowCheckout(false);
        setSelectedPackage(null);
        setKeepOpen(false);
        if (pendingPurchase) setDismissed(true);
      }}
      onPendingPurchase={(purchase) => {
        // The modal owns the parked purchase in sessionStorage; mirror its
        // clear/refresh back into the store so the modal re-reads correctly.
        // some phones' sign-in windows block storage: the purchase goes on without it
        try {
          if (purchase) {
            window.sessionStorage.setItem(PENDING_HOTSPOT_PURCHASE_KEY, JSON.stringify(purchase));
          } else {
            window.sessionStorage.removeItem(PENDING_HOTSPOT_PURCHASE_KEY);
          }
        } catch { /* storage blocked */ }
        if (!purchase) setKeepOpen(true);
        window.dispatchEvent(new Event(PENDING_HOTSPOT_PURCHASE_KEY));
      }}
    />
  )}
 </div>
 );
}
