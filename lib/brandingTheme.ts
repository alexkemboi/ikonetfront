import type { TenantBranding } from "@/lib/types/company";

/** Default brand tokens when no tenant branding resolves (Beesmart navy). */
export const DEFAULT_BRAND_COLORS = {
  primary: "#103766",
  secondary: "#18181b",
} as const;

/**
 * Pick a readable foreground (white or dark) for a hex background using
 * perceived luminance (WCAG-inspired, sRGB weights).
 */
export function pickForeground(hex: string): "#fff" | "#0b0d12" {
  const normalized = (hex ?? "").trim().replace(/^#/, "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return "#0b0d12";

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  // Above ~0.55 perceived brightness the surface is light → dark text wins.
  return luminance > 0.55 ? "#0b0d12" : "#fff";
}

/**
 * Map a tenant's brand to the design-system CSS variables consumed by
 * tailwind's `@theme inline` tokens (background surfaces stay neutral; the
 * brand color drives primary/ring/charts and the sidebar uses the secondary).
 */
export function brandCssVars(
  branding: TenantBranding | null
): Record<string, string> | undefined {
  if (!branding) return undefined;

  const primary = branding.primaryColor || DEFAULT_BRAND_COLORS.primary;
  const secondary = branding.secondaryColor || DEFAULT_BRAND_COLORS.secondary;
  const primaryOnPrimary = pickForeground(primary);
  const onSidebar = pickForeground(secondary);

  return {
    "--primary": primary,
    "--primary-foreground": primaryOnPrimary,
    "--secondary-foreground": primary,
    "--accent-foreground": primary,
    "--ring": primary,
    "--chart-1": primary,
    "--brand": primary,
    "--sidebar": secondary,
    "--sidebar-foreground": onSidebar,
    "--sidebar-primary": onSidebar,
    "--sidebar-primary-foreground": secondary,
    "--sidebar-accent": secondary,
    "--sidebar-accent-foreground": onSidebar,
    "--sidebar-border": secondary,
    "--sidebar-ring": primary,
  };
}