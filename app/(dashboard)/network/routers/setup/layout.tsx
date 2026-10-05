import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getPermissionForRoute } from "@/lib/data/nav";

/** The setup wizard is a client page, so its permission check lives here. */
export default async function RouterSetupLayout({ children }: { children: ReactNode }) {
  const pagePerms = await getPermissionForRoute("/network/routers");
  if (!pagePerms.canCreate) redirect("/dashboard");

  return <>{children}</>;
}
