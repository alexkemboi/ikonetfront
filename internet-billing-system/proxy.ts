import { NextResponse } from "next/server";
import { auth } from "./lib/auth";

const publicRoutes = ["/hotspot"];

const apiAuthPrefix = "/api/auth";
const authRoutes = ["/login", "/forgot-password", "/reset-password"];

const DEFAULT_LOGIN_REDIRECT = "/dashboard";

export default auth((req) => {
    const { nextUrl } = req;
    const isAuthenticated = !!req.auth;

    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
    const isPublicRoute  = publicRoutes.some((route) => nextUrl.pathname.startsWith(route));
    const isAuthRoute    = authRoutes.some((route) => nextUrl.pathname.startsWith(route));

    // Always let NextAuth's own API routes through
    if (isApiAuthRoute) return NextResponse.next();

    // On login/reset pages: send already-authed users to dashboard
    if (isAuthRoute) {
        if (isAuthenticated) {
            return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, req.url));
        }
        return NextResponse.next();
    }

    // Public pages: always allow
    if (isPublicRoute) return NextResponse.next();

    // Everything else is protected — redirect unauthenticated users to login
    if (!isAuthenticated) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
