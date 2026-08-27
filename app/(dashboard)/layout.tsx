import { type ReactNode } from "react";
import Sidebar from "./_components/Sidebar";
import TopBar from "./_components/TopBar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  apiMenusToNavGroups,
  extractPermissions,
  fetchRoleMenusRaw,
  getStaticNavForRole,
  staticNavToPermissions,
} from "@/lib/data/nav";
import type { NavGroup } from "@/lib/nav";
import { PermissionsProvider } from "@/providers/PermissionsProvider";
import type { PermissionMap } from "@/lib/types/roles";
import { normalizeRole } from "@/lib/types/roles";

/**
 * Dashboard shell — server component.
 *
 * Nav is driven by API menus when available, falling back to the static
 * per-role config (config/nav-*.ts) when the API returns no menus — e.g.
 * before the roles/menu permissions have been seeded in the database.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const rawRole  = session?.user?.role    ?? "";
  const role     = normalizeRole(rawRole);
  const apiToken = session?.user?.apiToken ?? "";

  const sidebarUser = session?.user
    ? {
        name:     session.user.fname ?? session.user.name ?? "User",
        email:    session.user.email ?? "",
        role:     session.user.role  ?? "",
        initials: ((session.user.fname?.[0] ?? "U") +
                  (session.user.middleName?.[0] ?? "")).toUpperCase(),
        username: session.user.username ?? session.user.name ?? "user",
      }
    : undefined;

  // Try server-driven menus first. If the API returns nothing (typical when
  // the roles/menu tables are unseeded), fall back to the static per-role
  // nav config so the sidebar still has items.
  const rawMenus = await fetchRoleMenusRaw(role, apiToken);

  const navGroups: NavGroup[] = rawMenus.length > 0
    ? apiMenusToNavGroups(rawMenus)
    : getStaticNavForRole(role);

  const permissionMap: PermissionMap = rawMenus.length > 0
    ? extractPermissions(rawMenus)
    : staticNavToPermissions(navGroups);

  return (
    <PermissionsProvider permissions={permissionMap}>
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
                }
              : undefined
            }
            navGroups={navGroups}
            brandName="Beesmart"
            sidebarUser={sidebarUser}
          />
          <main className="flex-1 overflow-y-auto py-4">
            {children}
          </main>
        </div>
      </div>
    </PermissionsProvider>
  );
}
