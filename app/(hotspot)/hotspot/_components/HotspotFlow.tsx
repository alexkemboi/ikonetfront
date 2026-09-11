"use client";

import { useState } from "react";
import ActivateTab from "./ActivateTab";
import BuyTab from "./BuyTab";
import { HotspotPackage } from "@/lib/types/hotspot";

type Tab = "activate" | "buy";

interface HotspotFlowProps {
  packages: HotspotPackage[];
  companyCode?: string | null;
  onCompanyResolved?: (companyCode?: string | null) => void;
}

export default function HotspotFlow({ packages, companyCode, onCompanyResolved }: HotspotFlowProps) {
  const [activeTab, setActiveTab] = useState<Tab>("activate");

  return (
    <div className="w-full">
      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab("activate")}
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
        <button
          onClick={() => setActiveTab("buy")}
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
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "activate" && <ActivateTab />}
        {activeTab === "buy" && (
          <BuyTab
            packages={packages}
            companyCode={companyCode}
            onCompanyResolved={onCompanyResolved}
            onBack={() => setActiveTab("activate")}
          />
        )}
      </div>
    </div>
  );
}