import { headers } from "next/headers";

/** Name and logo on the sign-in, password and invitation pages. */
export type AuthBrand = {
  /** Wordmark under the logo. */
  name: string;
  /** Logo image alt text and copyright holder. */
  legalName: string;
  logo: string;
  /** Browser tab title of the sign-in page; other pages append it. */
  title: string;
};

const BEESMART: AuthBrand = {
  name: "BEESMARTBEDAK",
  legalName: "Beesmart Bedak",
  logo: "/beesmart-logo.png",
  title: "BEESMARTBEDAK ISP",
};

const SPEEDLINK: AuthBrand = {
  name: "SpeedLink",
  legalName: "SpeedLink",
  logo: "/speedlink-logo.jpg",
  title: "SpeedLink",
};

/**
 * Production (beesmartbedak.com) and sandbox run the same build, so the brand follows the domain
 * the page was requested on. AUTH_BRAND=beesmart|speedlink overrides it (e.g. for local checks).
 */
export async function getAuthBrand(): Promise<AuthBrand> {
  const override = process.env.AUTH_BRAND?.trim().toLowerCase();
  if (override === "beesmart") return BEESMART;
  if (override === "speedlink") return SPEEDLINK;
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim();
  if (/(^|\.)beesmartbedak\.com(:\d+)?$/i.test(host)) return BEESMART;
  // behind a proxy that does not pass the domain on, the site's own URL (production's compose
  // file sets AUTH_URL=https://beesmartbedak.com) still says which deployment this is
  const siteUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  return /\/\/([^/]*\.)?beesmartbedak\.com(:\d+)?(\/|$)/i.test(siteUrl) ? BEESMART : SPEEDLINK;
}
