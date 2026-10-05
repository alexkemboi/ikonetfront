"use client";

import { createContext, useContext } from "react";
import { DEFAULT_PORTAL_BRAND } from "@/lib/brand";

/** Name of the company whose hotspot the customer is on, for every portal component. */
const HotspotBrandContext = createContext<string>(DEFAULT_PORTAL_BRAND);

export const HotspotBrandProvider = HotspotBrandContext.Provider;

export function useHotspotBrand(): string {
  return useContext(HotspotBrandContext);
}
