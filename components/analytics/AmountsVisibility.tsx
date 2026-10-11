"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { formatMoney } from "@/lib/analytics/format";

const STORAGE_KEY = "analytics.hideAmounts";

const AmountsContext = createContext<{ hidden: boolean; toggle: () => void }>({ hidden: false, toggle: () => {} });

// The choice lives in localStorage; these let React read it and hear about changes.
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readHidden(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false; // storage blocked: amounts stay visible
  }
}

/** One switch for every money figure on the page, remembered on this device. */
export function AmountsVisibilityProvider({ children }: { children: ReactNode }) {
  // amounts are visible on the server render and until this device's choice is read
  const hidden = useSyncExternalStore(subscribe, readHidden, () => false);

  const toggle = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, readHidden() ? "0" : "1");
    } catch {
      // storage blocked: the choice cannot be kept
    }
    listeners.forEach((listener) => listener());
  }, []);

  const value = useMemo(() => ({ hidden, toggle }), [hidden, toggle]);
  return <AmountsContext.Provider value={value}>{children}</AmountsContext.Provider>;
}

export function useAmountsHidden(): boolean {
  return useContext(AmountsContext).hidden;
}

/** A money figure that the page-wide switch can mask. */
export function Amount({ value, currency }: { value: string | null | undefined; currency: string }) {
  const hidden = useAmountsHidden();
  if (hidden) {
    return (
      <span>
        <span aria-hidden="true">••••••</span>
        <span className="sr-only">Amount hidden</span>
      </span>
    );
  }
  return <>{formatMoney(value, currency)}</>;
}

export function AmountsToggle() {
  const { hidden, toggle } = useContext(AmountsContext);
  const Icon = hidden ? Eye : EyeOff;
  const label = hidden ? "Show amounts" : "Hide amounts";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={hidden}
      aria-label={label}
      title={label}
      className="rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
    >
      <Icon className="size-3.5" aria-hidden="true" />
    </button>
  );
}
