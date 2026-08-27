// components/SessionGuard.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function SessionGuard({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const pathname= usePathname();

    useEffect(() => {
        // If the token refresh failed in the JWT callback, 
        // the backend/NextAuth sets an 'error' property on the session
        if ( session && session.error === "RefreshAccessTokenError" && !pathname.includes("/hotspot")) {
            signOut({ callbackUrl: "/login" });
        }
    }, [session]);

    return <>{children}</>;
}