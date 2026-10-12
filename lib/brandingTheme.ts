import type { TenantBranding } from "@/lib/types/company";

/** Default brand tokens when no tenant branding resolves. */
export const DEFAULT_BRAND_COLORS = {
  primary: "#064A96",
  secondary: "#07396F",
} as const;

/**
 * Pick whichever of white or charcoal gives stronger WCAG contrast on a hex background.
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

  const toLinear = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const red = toLinear(parseInt(full.slice(0, 2), 16));
  const green = toLinear(parseInt(full.slice(2, 4), 16));
  const blue = toLinear(parseInt(full.slice(4, 6), 16));
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  const darkTextLuminance = 0.004;
  const whiteContrast = 1.05 / (luminance + 0.05);
  const darkContrast = (luminance + 0.05) / (darkTextLuminance + 0.05);
  return darkContrast >= whiteContrast ? "#0b0d12" : "#fff";
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