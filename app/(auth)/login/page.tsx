import LoginForm from "./_components/LoginForm";

export const metadata = {
    title: "Ikonex Systems",
};

// NextAuth appends ?error=<code> on failed sign-in — map codes to user-friendly copy
const AUTH_ERRORS: Record<string, string> = {
    CredentialsSignin: "Invalid username or password.",
    Configuration: "Invalid username or password.",
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

    const errorMessage = error
        ? (AUTH_ERRORS[error] ?? "An unexpected error occurred. Please try again.")
        : undefined;

    return (
        <div className="space-y-6">
            <div className="space-y-1.5">
                <div className="w-8 h-1 rounded-full bg-warning mb-4" />
                <h2 className="text-2xl font-normal tracking-normal text-foreground">
                    Welcome back
                </h2>
                <p className="text-sm text-muted-foreground">
                    Sign in to reach your dashboard.
                </p>
            </div>

            <LoginForm error={errorMessage} />
        </div>
    );
}
