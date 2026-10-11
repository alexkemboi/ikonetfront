"use client";

import { type CSSProperties, type ReactNode } from "react";
import type { TenantBranding } from "@/lib/types/company";
import { brandCssVars } from "@/lib/brandingTheme";

/**
 * Track 2 — applies the resolved tenant brand as inline CSS custom properties
 * on a `display: contents` wrapper so every tailwind `@theme inline` token
 * below inherits the brand without touching globals.css. Falls back to the
 * default Ikonex Systems theme when no branding resolves (no-op).
 */
export function TenantTheme({
  branding,
  children,
}: {
  branding: TenantBranding | null;
  children: ReactNode;
}) {
  const vars = brandCssVars(branding);
  if (!vars) return <>{children}</>;

  return (
    <div style={vars as CSSProperties} className="contents" data-tenant-theme>
      {children}
    </div>
  );
}