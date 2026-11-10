/**
 * Signing a device in on the hotspot router from the device itself, the way captive portals do
 * it: the browser opens the router's own sign-in address (`$(link-login-only)` from the router
 * redirect, e.g. http://10.50.50.1/login) with the package code. The router asks RADIUS, signs
 * the device in and shows its "You are logged in" page, and Android re-tests the connection
 * at once and closes the sign-in window. It does not depend on the server reaching the router
 * over the management tunnel, which the server-side sign-in does.
 *
 * Opened as a link, not posted as a form: a form sent from this https page to the router's
 * http address makes the browser warn about an insecure form.
 */

export interface RouterLinks {
  /** `$(link-login-only)`: the router's sign-in address. */
  linkLogin?: string | null;
  /** `$(link-orig)`: the page the customer first asked for. */
  linkOrig?: string | null;
}

const PRIVATE_IPV4 = [/^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^169\.254\./];

/**
 * The router's sign-in address, only when it points at the local network: the package code is
 * sent there, and a router redirect that was tampered with must not send it anywhere else.
 */
export function safeRouterLoginUrl(linkLogin?: string | null): URL | null {
  if (!linkLogin) return null;
  try {
    const url = new URL(linkLogin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!PRIVATE_IPV4.some((range) => range.test(url.hostname))) return null;
    return new URL(url.origin + url.pathname);
  } catch {
    return null;
  }
}

/** The sign-in link for a package code, or null when the router gave no usable sign-in address. */
export function routerSignInUrl(links: RouterLinks, code: string): string | null {
  const url = safeRouterLoginUrl(links.linkLogin);
  if (!url || !code) return null;
  url.searchParams.set("username", code);
  url.searchParams.set("password", code);
  if (links.linkOrig && /^https?:\/\//i.test(links.linkOrig)) url.searchParams.set("dst", links.linkOrig);
  return url.toString();
}

// Browser-side holder, like the portal router: set when the portal page mounts, read when a
// purchase, a voucher or an "already paid" reconnect has gone through.
let current: RouterLinks = {};

export function setRouterLinks(links: RouterLinks): void {
  current = links;
}

export function getRouterLinks(): RouterLinks {
  return current;
}

/** Opens the router's sign-in for this code. False when the router gave no usable sign-in address. */
export function signInOnRouter(code: string): boolean {
  const url = routerSignInUrl(current, code);
  if (!url) return false;
  window.location.assign(url);
  return true;
}
