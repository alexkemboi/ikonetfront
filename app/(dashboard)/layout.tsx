import { type ReactNode } from "react";
import { headers } from "next/headers";
import Sidebar from "./_components/Sidebar";
import TopBar from "./_components/TopBar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  extractPermissions,
  fetchNavigation,
  fetchRoleMenusRaw,
  navigationToNavGroups,
} from "@/lib/data/nav";
import type { NavGroup, SidebarBrand } from "@/lib/nav";
import { DEFAULT_PLATFORM_BRAND } from "@/lib/brand";
import { PermissionsProvider } from "@/providers/PermissionsProvider";
import type { PermissionMap } from "@/lib/types/roles";
import type { TenantBranding } from "@/lib/types/company";
import { resolveCompanyContextCode } from "@/lib/companyContext";
import { getPublicBranding } from "@/actions/branding";
import { TenantTheme } from "@/components/tenant/TenantTheme";
import StepUpProvider from "@/providers/StepUpProvider";
import OmniSearchModal from "@/components/chrome/OmniSearchModal";
import { SessionHeartbeat } from "@/providers/MonitoringHeartbeat";
import { CompanyScopeProvider } from "@/providers/CompanyScopeProvider";
import { CompanyScopeBanner } from "@/components/tenant/CompanyRequired";
import { listCompanies } from "@/actions/companies";
import { AccessProvider } from "@/providers/AccessProvider";
import { hasPlatformScope, NO_ACCESS, type NavAccess } from "@/lib/access";

/**
 * Dashboard shell — server component.
 *
 * The sidebar comes from the database through GET /navigation/me: sections,
 * entries, labels, routes and icons (navigation_menus), filtered by the role's
 * grants (fail closed), plus the signed-in user's details and the brand of the
 * company in context. Nothing about the menu or the brand is hardcoded here.
 * Switching company calls router.refresh(), which re-renders this layout and so
 * reloads that company's brand and menus.
 *
 * The page permission map (PermissionsProvider) still comes from the role's
 * catalogue menus, as before.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const rawRole = session?.user?.role ?? "";
  const apiToken = session?.user?.apiToken ?? "";

  // The calls below do not depend on each other, so they run together.
  const [rawMenus, navigation, { contextCompany, tenantBranding }] = await Promise.all([
    // Page permissions are API-driven only. Empty (unknown role / unseeded / fetch error)
    // ⇒ empty permissions — fail closed.
    fetchRoleMenusRaw(rawRole, apiToken),
    // Sidebar layout, user details and company brand — all from the database.
    fetchNavigation(),
    // Track 2 — tenant theming: resolve the brand for the requesting subdomain
    // (custom domain / company-context cookie wins on the dashboard shell).
    (async () => {
      const headerStore = await headers();
      const siteHost = headerStore.get("host") ?? undefined;
      const contextCompany = await resolveCompanyContextCode();
      const tenantBranding = siteHost
        ? await getPublicBranding({ host: siteHost, company: contextCompany ?? undefined })
        : null;
      return { contextCompany, tenantBranding };
    })(),
  ]);

  const permissionMap: PermissionMap = rawMenus.length > 0 ? extractPermissions(rawMenus) : {};

  // What the role may do, from the database (fail closed when the API did not answer).
  const access: NavAccess = navigation.ok && navigation.data.access ? navigation.data.access : NO_ACCESS;
  // Tenancy F1 — a role that works across companies (the super admin, or one scoped PLATFORM)
  // chooses a company in the header; everyone else is fixed to the company in their token.
  const isPlatformAdmin = hasPlatformScope(access);
  const companies = isPlatformAdmin ? await listCompanies() : [];

  // The API refused the token (an administrator changed this account's role, company, station or
  // active state, or the session ended): sign out, so the next sign-in carries the new access.
  if (!navigation.ok && navigation.status === 401) {
    redirect("/signout?reason=permissions-changed");
  }
  const nav = navigation.ok ? navigation.data : null;
  const navGroups: NavGroup[] = nav ? navigationToNavGroups(nav.groups) : [];
  const navError = navigation.ok ? undefined : navigation.message;

  const scopedCompany = isPlatformAdmin ? contextCompany : (session.user.companyScope ?? null);

  // Brand: the company in context, else the company of this site's address, else
  // the platform's own entity; the built-in platform mark only when none has one.
  const brandSource = nav?.company ?? tenantBranding ?? nav?.platform ?? null;
  const brand: SidebarBrand = {
    name: brandSource?.name?.trim() || DEFAULT_PLATFORM_BRAND.name,
    logoUrl: brandSource?.logoUrl?.trim() || DEFAULT_PLATFORM_BRAND.logoUrl,
  };

  // Tenant colours: the site's company (custom domain / subdomain), else the company in context.
  const themeBranding: TenantBranding | null =
    tenantBranding ??
    (nav?.company
      ? { ...nav.company, alias: nav.company.alias ?? "", subdomain: "" }
      : null);

  // The signed-in user: the backend's view (profile, role name, company) when it
  // answered, else the session.
  const navUser = nav?.user;
  const displayName =
    navUser?.displayName?.trim() ||
    session.user.fname ||
    session.user.name ||
    session.user.username ||
    "User";
  const nameParts = displayName.split(/\s+/).filter(Boolean);
  const sidebarUser = {
    name: displayName,
    email: navUser?.email ?? session.user.email ?? "",
    role: navUser?.roleName || navUser?.role || session.user.role || "",
    initials: (
      (nameParts[0]?.[0] ?? "U") +
      (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "")
    ).toUpperCase(),
    username: navUser?.username ?? session.user.username ?? session.user.name ?? "user",
    company:
      nav?.company?.name ??
      (isPlatformAdmin ? "All companies" : (scopedCompany ?? undefined)),
  };

  return (
    <PermissionsProvider permissions={permissionMap}>
     <AccessProvider access={access}>
      <CompanyScopeProvider isPlatformAdmin={isPlatformAdmin} companyCode={scopedCompany} companies={companies}>
        <SessionHeartbeat />
        <StepUpProvider>
          <TenantTheme branding={themeBranding}>
            <div className="fixed inset-0 flex h-dvh overflow-hidden overscroll-none bg-background">
              <Sidebar
                navGroups={navGroups}
                brand={brand}
                user={sidebarUser}
                navError={navError}
              />

              <div className="dashboard-main-scroll flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain">
                <TopBar
                  notificationCount={0}
                  user={{
                    username: sidebarUser.username,
                    initials: sidebarUser.initials,
                    // raw session role, for display; decisions use the access from the database
                    role: session.user.role ?? "",
                    fname: sidebarUser.name,
                    middleName: "",
                    email: sidebarUser.email,
                    companyScope: session.user.companyScope ?? undefined,
                  }}
                  navGroups={navGroups}
                  brand={brand}
                  navError={navError}
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
     </AccessProvider>
    </PermissionsProvider>
  );
}
