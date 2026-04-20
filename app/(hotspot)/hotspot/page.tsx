import HotspotFlow from "./_components/HotspotFlow";
import { Wifi, Phone } from "lucide-react";
import { getHotspotPackages, checkActiveSession } from "@/actions/hotspot";
import { HotspotPackage } from "@/lib/types/hotspot";
import { headers } from "next/headers";

export const metadata = {
  title: "Connect to Wi-Fi — Beesmart Hotspot",
};

export default async function HotspotPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const packagesResponse = await getHotspotPackages();
  const packages: HotspotPackage[] = packagesResponse.success ? packagesResponse.data : [];

  const headerList = await headers();

  const macAddress =
    (searchParams.mac as string) ||
    headerList.get("x-mac-address") ||
    "00:00:00:00:00:00";

  const ipAddress =
    headerList.get("x-forwarded-for")?.split(",")[0].trim() ||
    headerList.get("x-real-ip") ||
    headerList.get("x-client-ip") ||
    (searchParams.ip as string) ||
    "127.0.0.1";

  const sessionResponse = await checkActiveSession(macAddress, ipAddress);
  const hasActiveSession = sessionResponse.success
    ? sessionResponse.data.hasActiveSession
    : false;
  const sessionMessage = sessionResponse.success
    ? sessionResponse.data.message
    : sessionResponse.message;

  return (
    <div className="min-h-screen flex flex-col px-8 sm:px-8 py-8">
      {/* Header */}
      <div className="mb-6 text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-1">
          <Wifi className="w-7 h-7 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            IKONEX Hotspot
          </h1>
          <a
            href="tel:0700000000"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary mt-1 hover:underline"
          >
            <Phone className="w-3.5 h-3.5" />
            Customer Care: 0700 000 000
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          Premium High-Speed Internet Access
        </p>
      </div>

      {/* Main card — full width, fills remaining height */}
      <div className="flex-1 max-w-8xl w-full">
        <HotspotFlow
          initialPackages={packages}
          initialHasActiveSession={hasActiveSession}
          initialSessionMessage={sessionMessage}
          macAddress={macAddress}
          ipAddress={ipAddress}
        />
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Powered by <span className="font-medium text-foreground">Beesmart</span>
      </p>
    </div>
  );
}
