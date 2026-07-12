import HotspotFlow from "./_components/HotspotFlow";
import { Wifi, Phone, Zap, Shield, Clock } from "lucide-react";
import { getHotspotPackages } from "@/actions/hotspot";
import { HotspotPackage } from "@/lib/types/hotspot";

export const metadata = {
  title: "Connect to Wi-Fi — Ikonex Hotspot",
  description: "Buy and activate hotspot packages with instant access",
};

export default async function HotspotPage() {
  const packagesResponse = await getHotspotPackages();
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

          <h1 className="text-4xl font-bold text-primary-foreground leading-tight mb-4">
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
          <p>© 2026 Beesmart. All rights reserved.</p>
        </div>
      </div>

      {/* Right Content Section - Light Background */}
      <div className="w-full lg:w-1/2 flex flex-col px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
        {/* Mobile Header */}
        <div className="lg:hidden mb-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <Wifi className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Ikonex Hotspot</h1>
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

          {/* Package Flow */}
          <div className="flex-1 w-full max-w-2xl">
            <HotspotFlow packages={packages} />
          </div>
        </div>

        {/* Footer with Company Info */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex flex-col gap-3 text-xs text-muted-foreground">
            <p>
              Powered by <span className="font-medium text-foreground">Beesmart</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-foreground" />
              <span>Support: <span className="font-medium text-foreground">0726837210</span></span>
            </p>
            <p>© 2026 Beesmart. All rights reserved.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
