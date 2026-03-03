import Link from "next/link";
import CustomerLoginForm from "./_components/CustomerLoginForm";

export const metadata = {
  title: "Customer Portal — Beesmart Billing",
};

export default function CustomerLoginPage() {
  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-1.5">
        {/* Orange accent bar */}
        <div className="w-8 h-1 rounded-full bg-warning mb-4" />
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Customer Portal
        </h2>
        <p className="text-sm text-muted-foreground">
          Sign in to manage your subscription, view invoices, and check your
          data usage.
        </p>
      </div>

      {/* Form (client component) */}
      <CustomerLoginForm />

      {/* Footer link */}
      <p className="text-center text-sm text-muted-foreground">
        Are you a staff member?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Staff login
        </Link>
      </p>
    </div>
  );
}
