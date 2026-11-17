import Image from "next/image";
import { Zap, Shield, Clock } from "lucide-react";

/**
 * The navy left-hero panel: shared by the working page and its error screen so a crash never
 * strips the branding a customer already trusted. The error screen has no fetched portal
 * context to show (that fetch may be what failed), so it renders this with only the defaults.
 */
export default function HotspotBrandHero({ brand, logoUrl, unoptimized }: { brand: string; logoUrl?: string | null; unoptimized?: boolean }) {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden flex-col justify-between p-12">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary-foreground opacity-5 -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-primary-foreground opacity-5 -ml-32 -mb-32" />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white p-3 shadow-xl ring-1 ring-white/20 mx-auto">
          <Image
            src={logoUrl || "/logo.png"}
            alt={brand}
            unoptimized={Boolean(unoptimized)}
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
  );
}
