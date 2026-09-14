import { getTvPackagesAction } from "@/actions/tv";
import HotspotShell from "./_components/HotspotShell";
import { Wifi, Zap, Shield, Clock } from "lucide-react";
import { getPublicHotspotPackagesAction } from "@/actions/hotspot";
import { HotspotPackage } from "@/lib/types/hotspot";
import { normalizeCompanyCode, resolveCompanyFromRouterTag } from "@/lib/brand";

export const metadata = {
  title: "Connect to Wi-Fi — Ikonex Hotspot",
  description: "Buy and activate hotspot packages with instant access",
};
export const dynamic = "force-dynamic"; // Ensure the page is always rendered on the server

interface HotspotPageProps {
  searchParams: Promise<{ company?: string; router?: string; mac?: string; ip?: string }>;
}

export default async function HotspotPage({ searchParams }: HotspotPageProps) {
  const params = await searchParams;
  const initialCompanyCode =
    normalizeCompanyCode(params?.company) ??
    resolveCompanyFromRouterTag(params?.router);

  // The MikroTik redirect carries the client device's real identity from
  // `$(mac)` / `$(ip)`. Without it, the backend defaults to 00:00:00:00:00:00 +
  // empty IP, which FreeRADIUS/MikroTik cannot match to a physical phone —
  // payment succeeds but the device never gets internet.
  const clientMac = params?.mac?.trim() || "";
  const clientIp = params?.ip?.trim() || "";

  const [packagesResponse, tvPackagesResult] = await Promise.all([
    getPublicHotspotPackagesAction(),
    getTvPackagesAction(),
  ]);
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
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-warning/20 mb-8">
            <Wifi className="w-5 h-5 text-warning" />
          </div>

          <h1 className="text-4xl font-normal text-primary-foreground leading-tight mb-4">
            Ultra-Fast Hotspot Connectivity
          </h1>

          <p className="text-base text-primary-foreground/80 mb-8 max-w-md">
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
          <p>© 2026 Ikonex. All rights reserved.</p>
        </div>
      </div>

      {/* Right Content Section - Light Background */}
      <div className="w-full lg:w-1/2 flex flex-col px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
        {/* Package Flow */}
        <div className="flex-1 w-full max-w-2xl">
          <HotspotShell
            packages={packages}
            tvPackages={tvPackagesResult.packages}
            tvPackagesError={tvPackagesResult.error}
            initialTvDevice={{ macAddress: "" }}
            initialCompanyCode={initialCompanyCode}
            clientMac={clientMac}
            clientIp={clientIp}
          />
        </div>
      </div>
    </main>
  );
}