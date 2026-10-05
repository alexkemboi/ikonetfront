/**
 * The router a hotspot customer arrived from, as issued by the platform in that router's
 * login page: a public router id (`rid`) and its signature (`sig`). The backend accepts the
 * pair only if the platform signed it, and takes the company from the router, so the portal
 * never names a company itself.
 */
export interface PortalRouter {
  rid: string;
  sig: string;
}

const RID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIG = /^[A-Za-z0-9_-]{20,128}$/;

/** The pair from the redirect query, or null when either part is missing or malformed. */
export function parsePortalRouter(rid?: string | null, sig?: string | null): PortalRouter | null {
  const id = rid?.trim() ?? "";
  const signature = sig?.trim() ?? "";
  return RID.test(id) && SIG.test(signature) ? { rid: id, sig: signature } : null;
}

/** Adds `rid` and `sig` to a backend path. Sent in the query so browser calls need no extra CORS header. */
export function withPortalRouter(path: string, router?: PortalRouter | null): string {
  if (!router) return path;
  const query = `rid=${encodeURIComponent(router.rid)}&sig=${encodeURIComponent(router.sig)}`;
  return path.includes("?") ? `${path}&${query}` : `${path}?${query}`;
}

// Browser-side holder: the portal page is loaded once per router redirect, so the pair is
// set when the page mounts and read by every call the customer triggers afterwards.
let current: PortalRouter | null = null;

export function setPortalRouter(router: PortalRouter | null): void {
  current = router;
}

export function getPortalRouter(): PortalRouter | null {
  return current;
}
