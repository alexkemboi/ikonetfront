import { type ReactNode } from "react";
import { headers } from "next/headers";
import Sidebar from "./_components/Sidebar";
import TopBar from "./_components/TopBar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
 apiMenusToNavGroups,
 extractPermissions,
 fetchRoleMenusRaw,
} from "@/lib/data/nav";
import type { NavGroup } from "@/lib/nav";
import { PermissionsProvider } from "@/providers/PermissionsProvider";
import type { PermissionMap } from "@/lib/types/roles";
import { resolveCompanyContextCode } from "@/lib/companyContext";
import { getPublicBranding } from "@/actions/branding";
import { TenantTheme } from "@/components/tenant/TenantTheme";
import StepUpProvider from "@/providers/StepUpProvider";
import OmniSearchModal from "@/components/chrome/OmniSearchModal";
import { SessionHeartbeat } from "@/providers/MonitoringHeartbeat";

/**
 * Dashboard shell — server component.
 *
 * Nav is driven exclusively by the API menu tree (fail closed). When the API
 * returns nothing — unseeded catalog, unknown role, or a transient failure —
 * the sidebar renders empty and permissions are empty rather than falling back
 * to a static, all-true nav.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
 const session = await auth();

 if (!session?.user) {
 redirect("/login");
 }

  const rawRole = session?.user?.role ?? "";
  const apiToken = session?.user?.apiToken ?? "";

 const sidebarUser = session?.user
 ? {
 name: session.user.fname ?? session.user.name ?? "User",
 email: session.user.email ?? "",
 role: session.user.role ?? "",
 initials: ((session.user.fname?.[0] ?? "U") +
 (session.user.middleName?.[0] ?? "")).toUpperCase(),
 username: session.user.username ?? session.user.name ?? "user",
 }
 : undefined;

  // API-driven menus only. Empty (unknown role / unseeded / fetch error) ⇒ empty
  // nav and empty permissions — fail closed, never the static all-true fallback.
  const rawMenus = await fetchRoleMenusRaw(rawRole, apiToken);

  const navGroups: NavGroup[] = rawMenus.length > 0 ? apiMenusToNavGroups(rawMenus) : [];

  const permissionMap: PermissionMap = rawMenus.length > 0 ? extractPermissions(rawMenus) : {};

 // Track 2 — tenant theming: resolve the brand for the requesting subdomain
 // (custom domain / company-context cookie wins on the dashboard shell).
 const headerStore = await headers();
 const siteHost = headerStore.get("host") ?? undefined;
 const contextCompany = await resolveCompanyContextCode();
 const tenantBranding = siteHost
 ? await getPublicBranding({ host: siteHost, company: contextCompany ?? undefined })
 : null;

return (
<PermissionsProvider permissions={permissionMap}>
<SessionHeartbeat />
<StepUpProvider>
  <TenantTheme branding={tenantBranding}>
  <div className="flex h-screen overflow-hidden bg-background">
  <Sidebar
  navGroups={navGroups}
  brandName="Beesmart"
  user={sidebarUser}
  />

  <div className="flex flex-1 flex-col overflow-hidden">
<TopBar
   notificationCount={0}
   user={sidebarUser
   ? {
   username: sidebarUser.username,
   initials: sidebarUser.initials,
   role: sidebarUser.role,
   fname: sidebarUser.name,
   middleName: "",
   email: sidebarUser.email,
   companyScope: session.user.companyScope ?? undefined,
   }
   : undefined
   }
   navGroups={navGroups}
   brandName="Beesmart"
   sidebarUser={sidebarUser}
   />
<main className="flex-1 overflow-y-auto py-4 pb-16">
  {children}
  </main>
  </div>
  </div>
  </TenantTheme>
  <OmniSearchModal />
  </StepUpProvider>
  </PermissionsProvider>
  );
 }
