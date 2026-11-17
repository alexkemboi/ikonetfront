import HotspotShell from "./_components/HotspotShell";
import HotspotBrandHero from "./_components/HotspotBrandHero";
import { cache } from "react";
import type { Metadata } from "next";
import { getHotspotPortalContextAction, getPublicHotspotPackagesAction } from "@/actions/hotspot";
import { HotspotPackage } from "@/lib/types/hotspot";
import { DEFAULT_PORTAL_BRAND, normalizeCompanyCode } from "@/lib/brand";
import { parsePortalRouter } from "@/lib/hotspot/portalRouter";

export const dynamic = "force-dynamic"; // Ensure the page is always rendered on the server

type HotspotSearchParams = { rid?: string; sig?: string; company?: string; router?: string; mac?: string; clientMac?: string; ip?: string; identity?: string; "link-login"?: string; "link-orig"?: string };

interface HotspotPageProps {
  searchParams: Promise<HotspotSearchParams>;
}

/**
 * Who is serving this customer? The router's login page sends its signed id (`rid`/`sig`);
 * the backend answers with the owning company. Routers that still run an older login page
 * are resolved from their RouterOS identity, the client IP or the `company` parameter.
 * One lookup per request, shared by the page title and the page body.
 */
const resolvePortal = cache(async (rid?: string, sig?: string, identity?: string, ip?: string, company?: string) => {
  const portalRouter = parsePortalRouter(rid, sig);
  const portalContext = await getHotspotPortalContextAction({
    portalRouter,
    routerIdentity: identity || undefined,
    clientIp: ip || undefined,
    company: normalizeCompanyCode(company) ?? undefined,
  });
  return { portalRouter, portalContext };
});

function portalOf(params: HotspotSearchParams) {
  return resolvePortal(params?.rid, params?.sig, params?.identity?.trim() || params?.router?.trim(), params?.ip?.trim(), params?.company);
}

export async function generateMetadata({ searchParams }: HotspotPageProps): Promise<Metadata> {
  const { portalContext } = await portalOf(await searchParams);

  return {
    title: `Connect to Wi-Fi — ${portalContext?.companyName ?? DEFAULT_PORTAL_BRAND}`,
    description: "Buy and activate hotspot packages with instant access",
  };
}

export default async function HotspotPage({ searchParams }: HotspotPageProps) {
  const params = await searchParams;
  const { portalRouter, portalContext } = await portalOf(params);
  const brand = portalContext?.companyName ?? DEFAULT_PORTAL_BRAND;
  const initialCompanyCode = portalContext?.companyCode ?? normalizeCompanyCode(params?.company);

  // The MikroTik redirect carries the client device's real identity from
  // `$(mac)` / `$(ip)`. Without it, the backend defaults to 00:00:00:00:00:00 +
  // empty IP, which FreeRADIUS/MikroTik cannot match to a physical phone —
  // payment succeeds but the device never gets internet.
  const clientMac = params?.mac?.trim() || "";
  const redirectClientMac = params?.clientMac?.trim() || "";
  const clientIp = params?.ip?.trim() || "";
  // Every router hands out the same hotspot subnet, so the backend pins the
  // serving router (tenant + auto-login target) by its RouterOS identity.
  const routerIdentity = params?.identity?.trim() || params?.router?.trim() || "";
  // The router's own sign-in address and the page first asked for: after a purchase the device
  // signs itself in there, which is instant and shows the router's "You are logged in" page.
  const routerLinks = { linkLogin: params?.["link-login"]?.trim() || null, linkOrig: params?.["link-orig"]?.trim() || null };

  // TV packages are per-device (the backend checks the MAC against the portal
  // session), so they are fetched client-side by TvDeviceSetup, not here.
  const packagesResponse = await getPublicHotspotPackagesAction({
    portalRouter,
    routerIdentity: routerIdentity || undefined,
    clientIp: clientIp || undefined,
    companyId: initialCompanyCode ?? undefined,
  });
  const packages: HotspotPackage[] = packagesResponse.success
    ? packagesResponse.data || []
    : [];

  return (
    <main className="min-h-screen flex bg-background">
      <HotspotBrandHero brand={brand} logoUrl={portalContext?.logoUrl} unoptimized={Boolean(portalContext?.logoUrl)} />

      {/* Right Content Section - Light Background */}
      <div className="w-full lg:w-1/2 flex flex-col px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
        {/* Package Flow */}
        <div className="flex-1 w-full max-w-2xl">
          <HotspotShell
            packages={packages}
            tvPackages={[]}
            initialTvDevice={{ macAddress: "", customerPhone: "" }}
            initialCompanyCode={initialCompanyCode}
            clientMac={clientMac}
            redirectClientMac={redirectClientMac}
            clientIp={clientIp}
            routerIdentity={routerIdentity}
            portalRouter={portalRouter}
            routerLinks={routerLinks}
            portalContext={portalContext}
          />
        </div>
      </div>
    </main>
  );
}
