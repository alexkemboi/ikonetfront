import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False on the server and until the page's script has taken over, true afterwards. A form that
 * is submitted before this is true would be sent by the browser as a plain GET, which puts its
 * fields (passwords included) in the address bar, history and server logs: keep submit disabled.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
