"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/** Appears once the page has been scrolled; the analytics page is long. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // the dashboard scrolls inside its main area on some layouts and on the window on others
    const onScroll = (event: Event) => {
      const target = event.target as Document | HTMLElement;
      const top = target instanceof Document ? window.scrollY : target.scrollTop;
      setVisible(top > 600);
    };
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", onScroll, { capture: true });
  }, []);

  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        document.getElementById("analytics-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground shadow-lg transition hover:bg-accent"
    >
      <ArrowUp className="size-3.5" aria-hidden="true" />
      Back to top
    </button>
  );
}
