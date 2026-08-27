import Link from "next/link";
import ResetPasswordForm from "./_components/ResetPasswordForm";
import { ArrowLeft } from "lucide-react";

export const metadata = {
 title: "Set New Password — Beesmart Billing",
};

export default async function ResetPasswordPage({
 searchParams,
}: {
 searchParams: Promise<{ email?: string }>;
}) {
 const { email = "" } = await searchParams;

 return (
 <div className="space-y-8">
 <Link
 href="/forgot-password"
 className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
 >
 <ArrowLeft className="w-3.5 h-3.5" />
 Back
 </Link>

 <div className="space-y-1.5">
 <h2 className="text-2xl font-bold tracking-tight text-foreground">
 Set New Password
 </h2>
 <p className="text-sm text-muted-foreground">
 Enter the code from your email and choose a new password.
 </p>
 </div>

 <ResetPasswordForm email={email} />
 </div>
 );
}
