"use client";

import { useState } from "react";
import { ChevronDown, Phone } from "lucide-react";
import { PORTAL_HELPLINE } from "@/lib/brand";
import type { HotspotHelplineInfo } from "@/actions/hotspot";

/**
 * Helpline for hotspot customers: one bold button that opens to show the
 * number and a tap-to-call link. A `tel:` link works inside the phone's
 * captive-portal browser, before the customer has any internet access.
 */
export default function HotspotHelpline({ helpline }: { helpline?: HotspotHelplineInfo | null }) {
  const [open, setOpen] = useState(false);
  // set by an administrator in the database; the built-in number only when the API was unreachable
  const line = helpline ?? PORTAL_HELPLINE;

  return (
    <div className="mx-auto w-full max-w-xs">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="hotspot-helpline-panel"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-base font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Phone className="h-5 w-5" aria-hidden="true" />
        Need help? Helpline
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <div
        id="hotspot-helpline-panel"
        hidden={!open}
        className="mt-2 rounded-xl border border-border bg-card p-4 text-center"
      >
        <p className="text-xs text-muted-foreground">{line.label}</p>
        <a
          href={`tel:${line.tel}`}
          className="mt-1 block text-2xl font-bold tracking-wide text-foreground underline-offset-4 hover:underline"
        >
          {line.display}
        </a>
        <p className="mt-1 text-xs text-muted-foreground">Tap the number to call · {line.hours}</p>
      </div>
    </div>
  );
}
