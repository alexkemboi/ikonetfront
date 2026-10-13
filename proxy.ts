import { NextResponse } from "next/server";
import { authMiddleware } from "./lib/auth";
import { normalizeRole, ROLE_NAME } from "./lib/types/roles";

const publicRoutes = ["/hotspot"];
const apiAuthPrefix = "/api/auth";
const authRoutes = ["/login", "/forgot-password", "/reset-password", "/signout"];
const DEFAULT_LOGIN_REDIRECT = "/dashboard";
const INVESTOR_HOME = "/finance/investor";

/** Investors (network partners) work only inside the investor portal (tenancy F4). */
function investorMayOpen(pathname: string): boolean {
    return (
        pathname === INVESTOR_HOME ||
        pathname.startsWith(`${INVESTOR_HOME}/`) ||
        pathname === "/dashboard" ||
        pathname === "/no-access" ||
        pathname.startsWith("/api/")
    );
}

// Assign the auth-wrapped function to a variable named `proxy`
export const proxy = authMiddleware((req) => {
    const { nextUrl } = req;
    const isAuthenticated = !!req.auth;
    const hasTokenError = req.auth?.error === "RefreshAccessTokenError";

    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
    const isPublicRoute = publicRoutes.some((route) => nextUrl.pathname.includes(route));
    const isAuthRoute = authRoutes.some((route) => nextUrl.pathname.includes(route));

    // Always let NextAuth's own API routes through
    if (isApiAuthRoute) return NextResponse.next();

    // On login/reset pages: send already-authed users to dashboard
    if (isAuthRoute) {
        if (isAuthenticated && !hasTokenError && req.auth?.user && nextUrl.pathname !== "/signout") {
            return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, req.url));
        }
        return NextResponse.next();
    }

    console.log("ispublic:", isPublicRoute, nextUrl.pathname);
    console.log("isauthenticated:", isAuthenticated);

    // Public pages: always allow
    if (isPublicRoute) return NextResponse.next();

    // Everything else is protected — redirect unauthenticated users to login
    if (!isAuthenticated || hasTokenError) {
        const loginUrl = new URL("/login", req.url);
        const response = NextResponse.redirect(loginUrl);
        for (const cookieName of [
            "authjs.session-token",
            "__Secure-authjs.session-token",
            "next-auth.session-token",
            "__Secure-next-auth.session-token",
        ]) {
            response.cookies.delete(cookieName);
        }
        return response;
    }

    if (normalizeRole(req.auth?.user?.role) === ROLE_NAME.INVESTOR && !investorMayOpen(nextUrl.pathname)) {
        return NextResponse.redirect(new URL(INVESTOR_HOME, req.url));
    }

    return NextResponse.next();
});

// Export the matcher config as before
export const config = {
    matcher: [
        "/((?!api/auth|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2|ttf|ico|map)).*)",
        "/",
        "/login",
        "/forgot-password",
        "/reset-password",
        "/signout",
        "/hotspot",
        "/settings/:path*",
        "/system/:path*",
        "/communications",
        "/communications/:path*",
        "/network/:path*",
        "/finance",
        "/finance/:path*",
        "/portal/:path*",
        "/customers",
        "/customers/:path*",
        "/dashboard",
        "/dashboard/:path*"

    ],
};