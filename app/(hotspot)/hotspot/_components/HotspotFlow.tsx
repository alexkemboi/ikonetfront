"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import ActivateTab from "./ActivateTab";
import BuyTab from "./BuyTab";
import { checkActiveSession } from "@/actions/hotspot";
import { HotspotPackage, type ReconnectResponseData } from "@/lib/types/hotspot";
import type { PortalRouter } from "@/lib/hotspot/portalRouter";

export type Tab = "activate" | "buy";

interface HotspotFlowProps {
  packages: HotspotPackage[];
  companyCode?: string | null;
  onCompanyResolved?: (companyCode?: string | null) => void;
  clientMac?: string;
  redirectClientMac?: string;
  clientIp?: string;
  /** RouterOS $(identity) of the serving router (redirect `identity`/`router`). */
  routerIdentity?: string;
  /** Signed id of the serving router; passed in because the page sets the shared one after this mounts. */
  portalRouter?: PortalRouter | null;
  /** Set by the page header's "Already paid?" link; the tabs below change it back. */
  tab?: Tab;
  onTabChange?: (tab: Tab) => void;
}

export default function HotspotFlow({
  packages,
  companyCode,
  onCompanyResolved,
  clientMac,
  redirectClientMac,
  clientIp,
  routerIdentity,
  portalRouter,
  tab,
  onTabChange,
}: HotspotFlowProps) {
  const [ownTab, setActiveTab] = useState<Tab>("buy");
  const activeTab = tab ?? ownTab;
  const [reconnected, setReconnected] = useState<ReconnectResponseData | null>(null);

  // Keep the first client render identical to the server, then apply URL state after hydration.
  useEffect(() => {
    if (tab !== undefined) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "activate") setActiveTab("activate");
  }, [tab]);

  // A device that already paid (and lost its connection to a power cut or a Wi-Fi drop) is
  // signed back in by the backend, so the customer is not left with "buy" as the only choice.
  useEffect(() => {
    const mac = clientMac || redirectClientMac;
    if (!mac || !clientIp) return;
    let cancelled = false;
    void checkActiveSession(mac, clientIp, portalRouter)
      .then((res) => {
        if (!cancelled && res.data?.hasActiveSession) setReconnected(res.data);
      })
      .catch(() => {
        // the portal works as before when the check cannot be made
      });
    return () => {
      cancelled = true;
    };
  }, [clientMac, redirectClientMac, clientIp, portalRouter]);

  const handleTabChange = (nextTab: Tab) => {
    setActiveTab(nextTab);
    onTabChange?.(nextTab);

    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (nextTab === "activate") {
      params.set("tab", "activate");
    } else {
      params.delete("tab");
    }

    const queryString = params.toString();
    const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
  };

  const reconnectedUntil = reconnected?.expiresAt ? new Date(reconnected.expiresAt) : null;

  return (
    <div className="w-full">
      {reconnected && (
        <div role="status" className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-medium">Welcome back, you&apos;re connected again.</p>
            <p>
              {reconnected.packageName ? `${reconnected.packageName}: ` : ""}
              {reconnectedUntil && !Number.isNaN(reconnectedUntil.getTime())
                ? `valid until ${reconnectedUntil.toLocaleString()}.`
                : reconnected.message}
            </p>
            <p className="mt-1 text-xs">No need to pay again. If pages don&apos;t open within a minute, turn Wi-Fi off and on.</p>
          </div>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-1 mb-4 border-b border-border">
        <button
          onClick={() => handleTabChange("buy")}
          className={`pb-3 px-4 font-medium text-sm transition-colors relative ${activeTab === "buy"
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Buy Packages
          {activeTab === "buy" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => handleTabChange("activate")}
          className={`pb-3 px-4 font-medium text-sm transition-colors relative ${activeTab === "activate"
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Activate Voucher
          {activeTab === "activate" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "activate" && (
          <ActivateTab clientMac={clientMac} clientIp={clientIp} routerIdentity={routerIdentity} />
        )}
        {activeTab === "buy" && (
          <BuyTab
            packages={packages}
            companyCode={companyCode}
            onCompanyResolved={onCompanyResolved}
            onBack={() => handleTabChange("activate")}
            clientMac={clientMac}
            redirectClientMac={redirectClientMac}
            clientIp={clientIp}
            routerIdentity={routerIdentity}
          />
        )}
      </div>
    </div>
  );
}
