import HotspotFlow from "./_components/HotspotFlow";
import { Wifi } from "lucide-react";

export const metadata = {
  title: "Connect to Wi-Fi — Beesmart Hotspot",
};

export default function HotspotPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="mb-8 text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
          <Wifi className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Connect to the Internet
        </h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          Choose a package, pay securely via M-Pesa or Airtel Money, and get
          online instantly.
        </p>
      </div>

      {/* Multi-step flow (client component) */}
      <div className="w-full max-w-6xl">
        <HotspotFlow />
      </div>

      {/* Footer branding */}
      <p className="mt-10 text-xs text-muted-foreground">
        Powered by{" "}
        <span className="font-medium text-foreground">Beesmart</span>
      </p>
    </div>
  );
}
