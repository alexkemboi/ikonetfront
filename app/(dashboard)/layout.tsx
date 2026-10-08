import { type ReactNode } from "react";
import { headers } from "next/headers";
import Sidebar from "./_components/Sidebar";
import TopBar from "./_components/TopBar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
 extractPermissions,
 fetchRoleMenusRaw,
 filterNavByPermissions,
 getNavLayoutForRole,
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
import { CompanyScopeProvider } from "@/providers/CompanyScopeProvider";
import { CompanyScopeBanner } from "@/components/tenant/CompanyRequired";
import { listCompanies } from "@/actions/companies";
import { isPlatformAdminRole } from "@/lib/types/roles";

/**
 * Dashboard shell — server component.
 *
 * Layout (groups, labels, order) comes from the static nav config; visibility
 * comes from the API menu permissions (fail closed). When the API returns
 * nothing — unseeded catalog, unknown role, or a transient failure — the
 * permission map is empty, so the sidebar renders empty rather than falling
 * back to a static, all-true nav.
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

  // Permissions are API-driven only. Empty (unknown role / unseeded / fetch error)
  // ⇒ empty permissions ⇒ empty nav — fail closed.
  const rawMenus = await fetchRoleMenusRaw(rawRole, apiToken);

  const permissionMap: PermissionMap = rawMenus.length > 0 ? extractPermissions(rawMenus) : {};

  // The static config decides where an entry sits; the permission map decides
  // whether this role sees it.
  const navGroups: NavGroup[] = filterNavByPermissions(getNavLayoutForRole(rawRole), permissionMap);

 // Track 2 — tenant theming: resolve the brand for the requesting subdomain
 // (custom domain / company-context cookie wins on the dashboard shell).
 const headerStore = await headers();
 const siteHost = headerStore.get("host") ?? undefined;
 const contextCompany = await resolveCompanyContextCode();

 // Tenancy F1 — only SYSADMIN carries a company selection; everyone else is
 // fixed to the company in their token.
 const isPlatformAdmin = isPlatformAdminRole(rawRole);
 const companies = isPlatformAdmin ? await listCompanies() : [];
 const scopedCompany = isPlatformAdmin ? contextCompany : (session.user.companyScope ?? null);
 const tenantBranding = siteHost
 ? await getPublicBranding({ host: siteHost, company: contextCompany ?? undefined })
 : null;

return (
<PermissionsProvider permissions={permissionMap}>
<CompanyScopeProvider isPlatformAdmin={isPlatformAdmin} companyCode={scopedCompany} companies={companies}>
<SessionHeartbeat />
<StepUpProvider>
  <TenantTheme branding={tenantBranding}>
  <div className="flex h-screen overflow-hidden bg-background">
  <Sidebar
  navGroups={navGroups}
  brandName="Beesmart"
  user={sidebarUser}
  />

  <div className="dashboard-main-scroll flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
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
<CompanyScopeBanner />
<main className="flex-1 py-4 pb-16">
  {children}
  </main>
  </div>
  </div>
  </TenantTheme>
  <OmniSearchModal />
  </StepUpProvider>
  </CompanyScopeProvider>
  </PermissionsProvider>
  );
 }
