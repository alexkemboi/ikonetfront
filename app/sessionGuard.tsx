// components/SessionGuard.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function SessionGuard({ children }: { children: React.ReactNode }) {
 const { data: session } = useSession();
 const pathname= usePathname();
 const signOutRef = useRef(false);

 useEffect(() => {
 // If the token refresh failed in the JWT callback, 
 // the backend/NextAuth sets an 'error' property on the session.
 // Sign out at most once per errored session — the effect re-runs on every
 // navigation because pathname is a dependency, and a second signOut would
 // redirect again from the /login page it just navigated to.
 if (signOutRef.current) return;
 if ( session && session.error === "RefreshAccessTokenError" && !pathname.includes("/hotspot")) {
 signOutRef.current = true;
 signOut({ callbackUrl: "/login" });
 }
 }, [session, pathname]);

 return <>{children}</>;
}