"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PermissionFlags, PermissionMap } from "@/lib/types/roles";
import { normalizeMenuRoute } from "@/lib/data/nav-constants";

// All-false default — safe fallback when a route is not in the map
const NO_PERMS: PermissionFlags = {
  canView: false, canCreate: false, canEdit: false, canDelete: false,
};

const PermissionsContext = createContext<PermissionMap>({});

export function PermissionsProvider({
  permissions,
  children,
}: {
  permissions: PermissionMap;
  children:    ReactNode;
}) {
  return (
    <PermissionsContext.Provider value={permissions}>
      {children}
    </PermissionsContext.Provider>
  );
}

/**
 * Returns the four permission flags for a given route.
 *
 * Usage in any client component:
 *   const perms = usePermissions("/system/packages");
 *   {perms.canCreate && <Button>Add Package</Button>}
 *
 * If the route is not in the map (e.g. permissions not yet configured),
 * all flags default to false — safest possible default.
 */
export function usePermissions(route: string): PermissionFlags {
  const map = useContext(PermissionsContext);
  // The map is keyed by normalized routes (legacy aliases resolve to one key).
  return map[route] ?? map[normalizeMenuRoute(route)] ?? NO_PERMS;
}
