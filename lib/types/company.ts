/** Track 2 — public tenant brand tokens (mirror of the backend record). */
export interface TenantBranding {
  code: string;
  name: string;
  alias: string;
  subdomain: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  logoUrl?: string | null;
  supportPhone?: string | null;
  supportEmail?: string | null;
}

/** Extractable brand tokens for CSS-variable injection. */
export interface BrandCssTokens {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarAccent: string;
  ring: string;
  chart1: string;
  accentForeground: string;
  brand: string;
}