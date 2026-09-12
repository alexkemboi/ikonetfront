"use client";

import { useState } from "react";
import ActivateTab from "./ActivateTab";
import BuyTab from "./BuyTab";
import { HotspotPackage } from "@/lib/types/hotspot";

type Tab = "activate" | "buy";

function resolveInitialTab(): Tab {
  if (typeof window === "undefined") return "buy";

  const params = new URLSearchParams(window.location.search);
  return params.get("tab") === "activate" ? "activate" : "buy";
}

interface HotspotFlowProps {
  packages: HotspotPackage[];
  companyCode?: string | null;
  onCompanyResolved?: (companyCode?: string | null) => void;
  clientMac?: string;
  clientIp?: string;
}

export default function HotspotFlow({
  packages,
  companyCode,
  onCompanyResolved,
  clientMac,
  clientIp,
}: HotspotFlowProps) {
  const [activeTab, setActiveTab] = useState<Tab>(resolveInitialTab);

  const handleTabChange = (nextTab: Tab) => {
    setActiveTab(nextTab);

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

  return (
    <div className="w-full">
      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 border-b border-border">
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
        {activeTab === "activate" && <ActivateTab />}
        {activeTab === "buy" && (
          <BuyTab
            packages={packages}
            companyCode={companyCode}
            onCompanyResolved={onCompanyResolved}
            onBack={() => handleTabChange("activate")}
            clientMac={clientMac}
            clientIp={clientIp}
          />
        )}
      </div>
    </div>
  );
}