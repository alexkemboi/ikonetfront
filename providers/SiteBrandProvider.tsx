"use client";

import { createContext, useContext, type ReactNode } from "react";
import { SPEEDLINK_BRAND, type SiteBrand } from "@/lib/siteBrand";

const SiteBrandContext = createContext<SiteBrand>(SPEEDLINK_BRAND);

/** Hands the server-resolved brand (root layout) to client components. */
export function SiteBrandProvider({ brand, children }: { brand: SiteBrand; children: ReactNode }) {
  return <SiteBrandContext.Provider value={brand}>{children}</SiteBrandContext.Provider>;
}

export function useSiteBrand(): SiteBrand {
  return useContext(SiteBrandContext);
}
