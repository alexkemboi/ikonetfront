"use client";

import { useState } from "react";
import { Wifi, Phone } from "lucide-react";
import HotspotFlow from "./HotspotFlow";
import { HotspotPackage } from "@/lib/types/hotspot";
import { getCustomerFacingBrand } from "@/lib/brand";

interface HotspotShellProps {
  packages: HotspotPackage[];
  initialCompanyCode?: string | null;
}

/**
 * Client shell that owns the customer-facing brand state.
 *
 * The brand is resolved from the router's walled-garden redirect query params
 * on first paint (server-rendered). When mobile Captive Network Assistant
 * handshakes drop those params, the payment initiate response carries
 * `companyId`, which re-hydrates the brand here — updating the header/footer,
 * not just the checkout modal.
 */
export default function HotspotShell({ packages, initialCompanyCode }: HotspotShellProps) {
  const [companyCode, setCompanyCode] = useState<string | null>(
    initialCompanyCode ?? null
  );
  const brand = getCustomerFacingBrand(companyCode);

  const handleCompanyResolved = (code?: string | null) => {
    if (code && code !== companyCode) setCompanyCode(code);
  };

  return (
    <div className="w-full">
      {/* Mobile Header */}
      <div className="lg:hidden mb-6">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
            <Wifi className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{brand}</h1>
            <p className="text-xs text-muted-foreground">Fast Internet Access</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
          Choose Your Plan
        </h2>
        <p className="text-sm text-muted-foreground mb-8">
          Select the perfect hotspot package for your connectivity needs
        </p>

        <div className="flex-1 w-full max-w-2xl">
          <HotspotFlow
            packages={packages}
            companyCode={companyCode}
            onCompanyResolved={handleCompanyResolved}
          />
        </div>
      </div>

      {/* Footer with Company Info */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex flex-col gap-3 text-xs text-muted-foreground">
          <p>
            Powered by <span className="font-medium text-foreground">{brand}</span>
          </p>
          <p className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-foreground" />
            <span>Support: <span className="font-medium text-foreground">0726837210</span></span>
          </p>
          <p>© 2026 {brand}. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}