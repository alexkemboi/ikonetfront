"use client";

import { useState } from "react";
import { Wifi, Phone, Tv } from "lucide-react";
import HotspotFlow from "./HotspotFlow";
import TvDeviceSetup from "./TvDeviceSetup";
import type { TvPackage } from "@/lib/types/tv";
import type { TvDeviceDetails } from "@/lib/validation/tv-device";
import { HotspotPackage } from "@/lib/types/hotspot";
import { getCustomerFacingBrand } from "@/lib/brand";

interface HotspotShellProps {
  packages: HotspotPackage[];
  initialTvDevice: TvDeviceDetails;
  tvPackages: TvPackage[];
  tvPackagesError?: string;
  initialCompanyCode?: string | null;
  clientMac?: string;
  redirectClientMac?: string;
  clientIp?: string;
  /** RouterOS $(identity) of the serving router (redirect `identity`/`router`). */
  routerIdentity?: string;
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
export default function HotspotShell({ packages, initialCompanyCode, clientMac, redirectClientMac, clientIp, routerIdentity, initialTvDevice, tvPackages, tvPackagesError }: HotspotShellProps) {
  const [companyCode, setCompanyCode] = useState<string | null>(
    initialCompanyCode ?? null
  );
  const [service, setService] = useState<"hotspot" | "tv">("hotspot");
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
            <h1 className="text-2xl font-normal text-foreground">{brand}</h1>
            <p className="text-xs text-muted-foreground">Fast Internet Access</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <h2 className="text-2xl lg:text-3xl font-normal text-foreground mb-2">
          {service === "tv" ? "Set up a TV or streaming device" : "Choose Your Plan"}
        </h2>
        <p className="text-sm text-muted-foreground mb-8">
          {service === "tv" ? "Connect your TV or streaming device in a few simple steps." : "Select the perfect hotspot package for your connectivity needs"}
        </p>

        <div role="group" aria-label="Choose internet service" className="grid grid-cols-2 gap-3 mb-6">
          {([
            { id: "hotspot", label: "Hotspot", description: "Internet for this device", Icon: Wifi },
            { id: "tv", label: "TV & Streaming device", description: "Set up your TV using your phone", Icon: Tv },
          ] as const).map(({ id, label, description, Icon }) => (
            <button key={id} type="button" aria-pressed={service === id} aria-controls={`${id}-service-panel`}
              onClick={() => setService(id)}
              className={`rounded-lg border p-4 text-left focus-visible:outline-2 focus-visible:outline-ring ${service === id ? "border-warning bg-warning text-warning-foreground" : "border-border bg-card text-foreground"}`}>
              <Icon className="size-5 mb-2" aria-hidden="true" />
              <span className="block font-medium">{label}</span>
              <span className="block text-xs mt-1">{description}</span>
            </button>
          ))}
        </div>
        <div id="tv-service-panel" hidden={service !== "tv"}>
          <TvDeviceSetup brand={brand} initialDevice={initialTvDevice} packages={tvPackages} packagesError={tvPackagesError} routerIdentity={routerIdentity} />
        </div>
        <div id="hotspot-service-panel" hidden={service !== "hotspot"} className="flex-1 w-full max-w-2xl">
          <HotspotFlow
            packages={packages}
            companyCode={companyCode}
            onCompanyResolved={handleCompanyResolved}
            clientMac={clientMac}
            redirectClientMac={redirectClientMac}
            clientIp={clientIp}
            routerIdentity={routerIdentity}
          />
        </div>
      </div>

      {/* Footer with Company Info */}
      <div className="mt-8 pt-6 border-t border-border mx-auto max-w-md text-center">
        <div className="flex flex-col gap-3 text-xs text-muted-foreground">
          <p>
            Powered by <span className="font-medium text-foreground">{brand}</span>
          </p>
          <p className="flex items-center gap-2 mx-auto">
            <Phone className="w-4 h-4 text-foreground" />
            <span>Support: <span className="font-medium text-foreground">0706 354 194</span></span>
          </p>
          <p>© 2026 {brand}. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
