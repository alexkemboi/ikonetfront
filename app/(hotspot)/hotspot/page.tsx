import Image from "next/image";
import HotspotShell from "./_components/HotspotShell";
import { Zap, Shield, Clock } from "lucide-react";
import { cache } from "react";
import type { Metadata } from "next";
import { getHotspotPortalContextAction, getPublicHotspotPackagesAction } from "@/actions/hotspot";
import { HotspotPackage } from "@/lib/types/hotspot";
import { DEFAULT_PORTAL_BRAND, normalizeCompanyCode } from "@/lib/brand";
import { parsePortalRouter } from "@/lib/hotspot/portalRouter";

export const dynamic = "force-dynamic"; // Ensure the page is always rendered on the server

type HotspotSearchParams = { rid?: string; sig?: string; company?: string; router?: string; mac?: string; clientMac?: string; ip?: string; identity?: string };

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
      {/* Left Hero Section - Dark Blue */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary-foreground opacity-5 -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-primary-foreground opacity-5 -ml-32 -mb-32" />

        {/* Content */}
        <div className="relative z-10">
 <div
              className="
                flex
                h-24
                w-24
                items-center
                justify-center
                rounded-2xl
                bg-white
                p-3
                shadow-xl
                ring-1
                ring-white/20
                mx-auto
              "
            >
              <Image
                src={portalContext?.logoUrl || "/speedlink-logo.jpg"}
                alt={brand}
                unoptimized={Boolean(portalContext?.logoUrl)}
                width={160}
                height={160}
                priority
                className="h-full w-full object-contain"
              />
            </div>
          <h1 className="text-4xl font-normal text-primary-foreground leading-tight mb-4 mx-auto text-center">
            Ultra-Fast Hotspot Connectivity
          </h1>

          <p className="text-base text-primary-foreground/80 mb-8 max-w-md mx-auto text-center">
            Instant activation, premium speeds, and flexible plans designed for your needs. Stay connected anywhere, anytime.
          </p>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-primary-foreground">Lightning-Fast Speeds</p>
                <p className="text-sm text-primary-foreground/70">High-speed data for streaming and browsing</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-primary-foreground">Secure Connection</p>
                <p className="text-sm text-primary-foreground/70">Encrypted and protected network access</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-primary-foreground">Instant Activation</p>
                <p className="text-sm text-primary-foreground/70">Start using immediately after purchase</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-sm text-primary-foreground/60">
          <p>© {new Date().getFullYear()} {brand}. All rights reserved.</p>
        </div>
      </div>

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
            portalContext={portalContext}
          />
        </div>
      </div>
    </main>
  );
}
