"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { can, holdsRight, NO_ACCESS, type AccessAction, type NavAccess } from "@/lib/access";

const AccessContext = createContext<NavAccess>(NO_ACCESS);

/** Puts the signed-in user's access (from the dashboard layout) in reach of client components. */
export function AccessProvider({ access, children }: { access: NavAccess; children: ReactNode }) {
  return <AccessContext.Provider value={access}>{children}</AccessContext.Provider>;
}

/** The user's access, with bound helpers: `const { can } = useAccess(); can("API_REGION", "EDIT")`. */
export function useAccess() {
  const access = useContext(AccessContext);
  return useMemo(
    () => ({
      access,
      can: (key: string, action: AccessAction = "VIEW") => can(access, key, action),
      holdsRight: (key: string) => holdsRight(access, key),
      isSuperAdmin: access.superAdmin,
    }),
    [access]
  );
}
