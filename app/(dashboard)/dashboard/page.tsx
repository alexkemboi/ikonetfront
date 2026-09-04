import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getLandingRouteForRole } from "@/lib/types/roles";

export const dynamic = "force-dynamic";

export default async function DashboardDispatcherPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  redirect(getLandingRouteForRole(session.user.role));
}
