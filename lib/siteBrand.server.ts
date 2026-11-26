import { headers } from "next/headers";
import { brandFor, type SiteBrand } from "@/lib/siteBrand";

/** The brand of the address this request came in on (see lib/siteBrand.ts). */
export async function getSiteBrand(): Promise<SiteBrand> {
  const h = await headers();
  return brandFor(
    h.get("x-forwarded-host") ?? h.get("host"),
    // production's compose file sets AUTH_URL=https://beesmartbedak.com
    process.env.AUTH_URL ?? process.env.NEXTAUTH_URL,
    process.env.AUTH_BRAND,
  );
}
