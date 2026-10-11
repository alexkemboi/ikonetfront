import { headers } from "next/headers";
import LoginForm from "./_components/LoginForm";
import { getPublicBranding } from "@/actions/branding";

export const metadata = {
    title: "Ikonex Systems",
};

// NextAuth appends ?error=<code> on failed sign-in — map codes to user-friendly copy
const AUTH_ERRORS: Record<string, string> = {
    CredentialsSignin: "Invalid username or password, or the account does not belong to that organisation.",
    Configuration: "Invalid username or password, or the account does not belong to that organisation.",
    AccessDenied: "You do not have permission to access this system.",
    SessionRequired: "Your session has expired. Please sign in again.",
    OAuthAccountNotLinked: "This account is linked to a different sign-in method.",
    CallbackRouteError: "Something went wrong during sign-in. Please try again.",
    RefreshAccessTokenError: "Your session has expired. Please sign in again.",
};

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;

    // A company's own web address (subdomain or custom domain) already names the organisation.
    const host = (await headers()).get("host") ?? undefined;
    const hostBranding = host ? await getPublicBranding({ host }) : null;
    const hostOrganisation = hostBranding
        ? { code: hostBranding.code, name: hostBranding.name, logoUrl: hostBranding.logoUrl ?? null }
        : null;

    const errorMessage = error
        ? (AUTH_ERRORS[error] ?? "An unexpected error occurred. Please try again.")
        : undefined;

    return (
        <div className="space-y-6">
            <div className="space-y-1.5">
                <div className="w-8 h-1 rounded-full bg-warning mb-4" />
                <h2 className="text-2xl font-normal tracking-normal text-foreground">
                    {hostOrganisation ? `Welcome to ${hostOrganisation.name}` : "Welcome back"}
                </h2>
                <p className="text-sm text-muted-foreground">
                    Sign in to reach your dashboard.
                </p>
            </div>

            <LoginForm error={errorMessage} hostOrganisation={hostOrganisation} />
        </div>
    );
}
