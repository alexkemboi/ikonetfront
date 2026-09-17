"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogOut, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";
import { clearCompanyContextCookie } from "@/lib/companyContextClient";

export default function SignOutCard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
  setLoading(true);
  try {
  // R-16: drop the tenant-context cookie so the next login starts clean.
  clearCompanyContextCookie();
  await logoutAction(session?.user?.apiToken ?? "").catch((err) =>
  console.warn("Backend logout notification failed:", err)
  );
  } finally {
  await signOut({ callbackUrl: "/login" });
  }
  }

 return (
 <div className="w-full max-w-sm">
 {/* Card */}
 <div className="bg-card rounded-2xl border border-border shadow-xl px-8 py-10 space-y-8">

 {/* Icon */}
 <div className="flex justify-center">
 <div className="w-16 h-16 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center">
 <LogOut className="w-7 h-7 text-danger" />
 </div>
 </div>

 {/* Copy */}
 <div className="text-center space-y-2">
 <h1 className="text-xl font-normal text-foreground tracking-normal">
 Sign out
 </h1>
 <p className="text-sm text-muted-foreground leading-relaxed">
 Are you sure you want to sign out of{" "}
 <span className="font-medium text-foreground">Beesmart</span>?
 You&apos;ll need to sign in again to access your dashboard.
 </p>
 </div>

 {/* Actions */}
 <div className="space-y-3">
 <Button
 className="w-full bg-danger hover:bg-danger/90 text-foreground gap-2"
 disabled={loading}
 onClick={handleSignOut}
 >
 {loading ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <LogOut className="w-4 h-4" />
 )}
 {loading ? "Signing out…" : "Yes, sign out"}
 </Button>

 <Button
 variant="outline"
 className="w-full gap-2"
 disabled={loading}
 onClick={() => router.back()}
 >
 <ArrowLeft className="w-4 h-4" />
 Cancel
 </Button>
 </div>
 </div>

 {/* Footer */}
 <p className="text-center text-xs text-white/30 mt-6">
 © {new Date().getFullYear()} Beesmart. All rights reserved.
 </p>
 </div>
 );
}
