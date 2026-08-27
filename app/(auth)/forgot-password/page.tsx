import Link from "next/link";
import ForgotPasswordForm from "./_components/ForgotPasswordForm";
import { ArrowLeft } from "lucide-react";

export const metadata = {
 title: "Reset Password — Beesmart Billing",
};

export default function ForgotPasswordPage() {
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
 Reset Password
 </h2>
 <p className="text-sm text-muted-foreground">
 Enter the email address associated with your account and we&apos;ll
 send you a reset link.
 </p>
 </div>

 {/* Form (client component) */}
 <ForgotPasswordForm />
 </div>
 );
}
