"use client";

import { useEffect, useState } from "react";
import { Wifi, Tv } from "lucide-react";
import HotspotFlow, { type Tab } from "./HotspotFlow";
import HotspotHelpline from "./HotspotHelpline";
import HotspotHowTo from "./HotspotHowTo";
import TvDeviceSetup from "./TvDeviceSetup";
import type { TvPackage } from "@/lib/types/tv";
import type { TvDeviceDetails } from "@/lib/validation/tv-device";
import { HotspotPackage } from "@/lib/types/hotspot";
import { DEFAULT_PORTAL_BRAND } from "@/lib/brand";
import { getHotspotPortalContextAction, type HotspotHelplineInfo, type HotspotPortalContext } from "@/actions/hotspot";
import { HotspotBrandProvider } from "@/lib/hotspot/brand-context";
import { setPortalRouter, type PortalRouter } from "@/lib/hotspot/portalRouter";
import { setRouterLinks, type RouterLinks } from "@/lib/hotspot/routerSignIn";

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
  /** Signed router id from the router's login page (`rid`/`sig`). */
  portalRouter?: PortalRouter | null;
  /** The router's sign-in address and original page, from its redirect. */
  routerLinks?: RouterLinks;
  /** Company of the serving router, resolved by the backend on the server render. */
  portalContext?: HotspotPortalContext | null;
  /** Helpline from the database; null falls back to the built-in number. */
  helpline?: HotspotHelplineInfo | null;
}

/**
 * Client shell that owns the customer-facing brand state.
 *
 * The company is resolved by the backend from the router's signed id on first
 * paint (server-rendered). When mobile Captive Network Assistant handshakes drop
 * the redirect params, the payment initiate response carries `companyId`; the
 * company's name is then fetched for it — updating the header/footer, not just
 * the checkout modal.
 */
export default function HotspotShell({ packages, initialCompanyCode, clientMac, redirectClientMac, clientIp, routerIdentity, portalRouter, routerLinks, portalContext, helpline, initialTvDevice, tvPackages, tvPackagesError }: HotspotShellProps) {
  const [companyCode, setCompanyCode] = useState<string | null>(
    portalContext?.companyCode ?? initialCompanyCode ?? null
  );
  const [context, setContext] = useState<HotspotPortalContext | null>(portalContext ?? null);
  const [service, setService] = useState<"hotspot" | "tv">("hotspot");
  const [flowTab, setFlowTab] = useState<Tab | undefined>(undefined);
  const brand = context?.companyName ?? DEFAULT_PORTAL_BRAND;

  // Every call the customer triggers from this page carries the router it was served by.
  useEffect(() => {
    setPortalRouter(portalRouter ?? null);
  }, [portalRouter]);
  useEffect(() => {
    setRouterLinks(routerLinks ?? {});
  }, [routerLinks]);

  // "Already paid?" in the header: the M-Pesa code form, wherever the customer is on the page.
  const showAlreadyPaid = () => {
    setService("hotspot");
    setFlowTab("activate");
    requestAnimationFrame(() => document.getElementById("already-paid")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const handleCompanyResolved = (code?: string | null) => {
    if (!code || code === companyCode) return;
    setCompanyCode(code);
    if (context?.companyCode !== code) {
      void getHotspotPortalContextAction({ portalRouter, company: code }).then((resolved) => {
        if (resolved) setContext(resolved);
      });
    }
  };

  return (
    <HotspotBrandProvider value={brand}>
    <div className="w-full">
      {/* Header: brand on the left, the way back for customers who already paid on the right */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 lg:hidden">
          <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Wifi className="size-4 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="truncate text-lg font-normal text-foreground">{brand}</h1>
        </div>
        <h2 className="hidden text-2xl font-normal text-foreground lg:block">
          {service === "tv" ? "Set up a TV" : "Choose a package"}
        </h2>
        <button type="button" onClick={showAlreadyPaid}
          className="shrink-0 rounded-md border border-primary/40 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-ring">
          Already paid? Click here
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div role="group" aria-label="Choose internet service" className="grid grid-cols-2 gap-2 mb-4">
          {([
            { id: "hotspot", label: "Hotspot", Icon: Wifi },
            { id: "tv", label: "TV & Streaming", Icon: Tv },
          ] as const).map(({ id, label, Icon }) => (
            <button key={id} type="button" aria-pressed={service === id} aria-controls={`${id}-service-panel`}
              onClick={() => setService(id)}
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring ${service === id ? "border-warning bg-warning text-warning-foreground" : "border-border bg-card text-foreground"}`}>
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
        <div id="tv-service-panel" hidden={service !== "tv"}>
          <TvDeviceSetup brand={brand} initialDevice={initialTvDevice} packages={tvPackages} packagesError={tvPackagesError} routerIdentity={routerIdentity} clientIp={clientIp} />
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
            portalRouter={portalRouter}
            tab={flowTab}
            onTabChange={setFlowTab}
          />
        </div>
      </div>

      {/* Explanations below the packages, for those who want them */}
      <div className="mt-8">
        <HotspotHowTo service={service} />
      </div>

      {/* Footer with Company Info */}
      <div className="mt-8 pt-6 border-t border-border mx-auto max-w-md text-center">
        <div className="flex flex-col gap-3 text-xs text-muted-foreground">
          <p>
            Powered by <span className="font-medium text-foreground">{brand}</span>
          </p>
          <HotspotHelpline helpline={helpline} />
          <p>© 2026 {brand}. All rights reserved.</p>
        </div>
      </div>
    </div>
    </HotspotBrandProvider>
  );
}
