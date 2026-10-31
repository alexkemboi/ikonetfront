import { headers } from "next/headers";

/**
 * The visitor's address and browser, for calls a server action makes on their behalf
 * (sign-in, password reset). Without them the backend audit log records the Next.js server
 * ("IP unknown", "node") instead of the person.
 *
 * The address is the one our own proxy saw: X-Real-IP, else the LAST X-Forwarded-For entry
 * (the proxy appends it; earlier entries are whatever the visitor chose to send).
 */
export async function clientOriginHeaders(): Promise<Record<string, string>> {
  let incoming: Headers;
  try {
    incoming = await headers();
  } catch {
    return {}; // not inside a request (tests, scripts)
  }
  const out: Record<string, string> = {};
  const realIp = incoming.get("x-real-ip")?.trim();
  const forwarded = incoming.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean);
  const ip = realIp || forwarded?.[forwarded.length - 1];
  if (ip && /^[0-9a-fA-F:.]{2,45}$/.test(ip)) out["X-Forwarded-For"] = ip;
  const agent = incoming.get("user-agent");
  if (agent) out["User-Agent"] = agent.slice(0, 300);
  return out;
}
