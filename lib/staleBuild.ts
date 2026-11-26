import { unstable_isUnrecognizedActionError } from "next/navigation";

const RELOADED_AT_KEY = "ibs:stale-build-reload-at";
/** A second stale-build error this soon after reloading is not fixed by reloading again. */
const RELOAD_GUARD_MS = 30_000;

/**
 * After a deploy, a page loaded from the previous build still calls the server actions of that
 * build, which the new build does not have (404 "Server action not found"). Reloading picks up
 * the new build. Returns true when the page is reloading, so the caller shows no error.
 */
export function reloadIfStaleBuild(error: unknown): boolean {
  if (!unstable_isUnrecognizedActionError(error) || typeof window === "undefined") return false;
  try {
    const last = Number(window.sessionStorage.getItem(RELOADED_AT_KEY) ?? 0);
    if (Date.now() - last < RELOAD_GUARD_MS) return false;
    window.sessionStorage.setItem(RELOADED_AT_KEY, String(Date.now()));
  } catch {
    // no session storage (private mode): reload anyway, at worst once per error
  }
  window.location.reload();
  return true;
}
