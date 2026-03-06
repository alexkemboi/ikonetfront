import LoginForm from "./_components/LoginForm";

export const metadata = {
  title: "Sign In — Beesmart Billing",
};

// NextAuth appends ?error=<code> on failed sign-in — map codes to user-friendly copy
const AUTH_ERRORS: Record<string, string> = {
  CredentialsSignin:    "Invalid username or password. Please try again.",
  AccessDenied:         "You do not have permission to access this system.",
  SessionRequired:      "Your session has expired. Please sign in again.",
  OAuthAccountNotLinked:"This account is linked to a different sign-in method.",
  CallbackRouteError:   "Something went wrong during sign-in. Please try again.",
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
    <div className="space-y-8">
      <div className="space-y-1.5">
        <div className="w-8 h-1 rounded-full bg-warning mb-4" />
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="text-sm text-muted-foreground">
          Sign in with your username or account number to continue.
        </p>
      </div>

      <LoginForm error={errorMessage} />
    </div>
  );
}
