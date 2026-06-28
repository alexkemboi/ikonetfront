"use client";

import { useState } from "react";
import ActivateTab from "./ActivateTab";
import BuyTab from "./BuyTab";
import { HotspotPackage } from "@/lib/types/hotspot";

type Tab = "activate" | "buy";

interface HotspotFlowProps {
  packages: HotspotPackage[];
}

export default function HotspotFlow({ packages }: HotspotFlowProps) {
  const [activeTab, setActiveTab] = useState<Tab>("activate");
  const [showTabs, setShowTabs] = useState(true);

  const handleStartPurchase = () => {
    setShowTabs(false);
  };

  const handleBackToTabs = () => {
    setShowTabs(true);
  };

  if (!showTabs) {
    return <BuyTab packages={packages} onBack={handleBackToTabs} />;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Tab navigation */}
      <div className="flex gap-3 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab("activate")}
          className={`pb-3 px-4 font-medium text-sm transition-colors ${activeTab === "activate"
              ? "text-primary border-b-2 border-primary -mb-[2px]"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Activate Voucher
        </button>
        <button
          onClick={() => setActiveTab("buy")}
          className={`pb-3 px-4 font-medium text-sm transition-colors ${activeTab === "buy"
              ? "text-primary border-b-2 border-primary -mb-[2px]"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Buy Voucher
        </button>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "activate" && (
          <ActivateTab />
        )}
        {activeTab === "buy" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a package and purchase using M-Pesa
            </p>
            <button
              onClick={handleStartPurchase}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Start Purchase
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
