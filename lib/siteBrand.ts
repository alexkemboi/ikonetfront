/**
 * The brand of a deployment. Production (beesmartbedak.com) and sandbox run the same build, so
 * the brand follows the domain: production is BEESMARTBEDAK with its globe logo, every other
 * address (sandbox, local) is SpeedLink. No SpeedLink name or logo is ever shown on production.
 *
 * Pure (no server imports): the server reads it through getSiteBrand (lib/siteBrand.server.ts),
 * client components through useSiteBrand (providers/SiteBrandProvider).
 */
export type SiteBrand = {
  key: "beesmart" | "speedlink";
  /** Wordmark next to / under the logo. */
  name: string;
  /** Logo alt text, copyright holder and running text ("… ran into an error"). */
  legalName: string;
  logo: string;
  /** Browser tab title on its own; pages show "<page> — <title>". */
  title: string;
};

export const BEESMART_BRAND: SiteBrand = {
  key: "beesmart",
  name: "BEESMARTBEDAK",
  legalName: "Beesmart Bedak",
  logo: "/beesmart-logo.png",
  title: "BEESMARTBEDAK ISP",
};

export const SPEEDLINK_BRAND: SiteBrand = {
  key: "speedlink",
  name: "SpeedLink",
  legalName: "SpeedLink",
  logo: "/speedlink-logo.jpg",
  title: "SpeedLink",
};

const PRODUCTION_HOST = /(^|\.)beesmartbedak\.com(:\d+)?$/i;
const PRODUCTION_URL = /\/\/([^/]*\.)?beesmartbedak\.com(:\d+)?(\/|$)/i;

/**
 * @param host    the address the page was requested on (Host / X-Forwarded-Host, or location.host)
 * @param siteUrl the site's own URL (AUTH_URL), for when a proxy does not pass the address on
 * @param override AUTH_BRAND=beesmart|speedlink, for local checks
 */
export function brandFor(host: string | null | undefined, siteUrl?: string | null, override?: string | null): SiteBrand {
  const forced = override?.trim().toLowerCase();
  if (forced === "beesmart") return BEESMART_BRAND;
  if (forced === "speedlink") return SPEEDLINK_BRAND;
  const first = (host ?? "").split(",")[0].trim();
  if (PRODUCTION_HOST.test(first)) return BEESMART_BRAND;
  return siteUrl && PRODUCTION_URL.test(siteUrl) ? BEESMART_BRAND : SPEEDLINK_BRAND;
}
