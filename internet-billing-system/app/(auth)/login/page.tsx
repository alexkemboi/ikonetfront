import LoginForm from "./_components/LoginForm";

export const metadata = {
  title: "Sign In — Beesmart Billing",
};

export default function LoginPage() {
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

      <LoginForm />
    </div>
  );
}
