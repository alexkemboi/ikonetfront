import Link from "next/link";
import LoginForm from "./_components/LoginForm";

export const metadata = {
  title: "Staff Login — Beesmart Billing",
};

export default function LoginPage() {
  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Staff Portal
        </h2>
        <p className="text-sm text-muted-foreground">
          Sign in with your staff credentials to continue.
        </p>
      </div>

      {/* Form (client component) */}
      <LoginForm />

      {/* Footer link */}
      <p className="text-center text-sm text-muted-foreground">
        Looking for the{" "}
        <Link
          href="/customer-portal/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Customer Portal?
        </Link>
      </p>
    </div>
  );
}
