import Link from "next/link";
import ResetPasswordForm from "./_components/ResetPasswordForm";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Set New Password — Beesmart Billing",
};

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to login
      </Link>

      {/* Heading */}
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Set New Password
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose a strong password. You&apos;ll be asked to sign in again after
          resetting.
        </p>
      </div>

      {/* Form — token passed as prop, validation handled server-side by dev */}
      <ResetPasswordForm />
    </div>
  );
}
