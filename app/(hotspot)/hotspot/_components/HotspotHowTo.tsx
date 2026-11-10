"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const STEPS = {
  hotspot: {
    title: "How to connect",
    steps: [
      "Pick a package above and tap Select.",
      "Enter the M-Pesa number that will pay. It can be anyone's number; the internet goes to this device.",
      "Check that phone for the M-Pesa prompt and enter the PIN.",
      "Stay on this page. You are connected automatically, usually within a minute.",
    ],
    voucher: "Have a voucher code? Open Activate Voucher and enter the code on the device you want to use.",
    note: "If you paid and are not connected, do not pay again. The system keeps trying, and the helpline can help.",
  },
  tv: {
    title: "How to set up your TV",
    steps: [
      "Connect the TV or streaming box to this Wi-Fi first.",
      "On this phone, pick the TV from the list of devices on this network.",
      "Choose a TV package and pay by M-Pesa from any number.",
      "The TV comes online by itself within about two minutes. You do not need to type anything on the TV.",
    ],
    voucher: null,
    note: "If the TV is not listed, turn its Wi-Fi off and on, then refresh this page.",
  },
} as const;

/** Short instructions for first-time buyers, below the packages and closed by default. */
export default function HotspotHowTo({ service }: { service: "hotspot" | "tv" }) {
  const [open, setOpen] = useState(false);
  const content = STEPS[service];

  return (
    <div className="mb-6 rounded-lg border border-border bg-card">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="hotspot-howto-panel"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <HelpCircle className="size-4 text-primary" aria-hidden="true" />
        <span className="flex-1">{content.title}</span>
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <div id="hotspot-howto-panel" hidden={!open} className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
        <ol className="list-decimal space-y-1.5 pl-5">
          {content.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {content.voucher && <p className="mt-3">{content.voucher}</p>}
        <p className="mt-3">{content.note}</p>
      </div>
    </div>
  );
}
