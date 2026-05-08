import { type ReactNode } from "react";
import Sidebar from "./_components/Sidebar";
import TopBar from "./_components/TopBar";
import { auth } from "@/lib/auth";
import { getStaticNavForRole } from "@/lib/data/nav";
// import { fetchRoleMenusRaw, apiMenusToNavGroups } from "@/lib/data/nav";

/**
 * Dashboard shell — server component.
 *
 * Nav is driven by static configs in config/nav-*.ts, keyed on role code:
 *   01 → adminNavGroups       (Dashboard, Customers, Network, Finance, System, Settings)
 *   02 → managementNavGroups  (Dashboard, Customers, Finance, System)
 *   03 → staffNavGroups       (Dashboard, Customers, Network)
 *   04 → customerNavGroups    (Dashboard)
 *
 * To re-enable server-driven menus, uncomment the fetchRoleMenusRaw block below
 * and replace `navGroups = getStaticNavForRole(roleCode)` with the API path.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  const roleCode = session?.user?.role    ?? "";
  // const apiToken = session?.user?.apiToken ?? "";

  const sidebarUser = session?.user
    ? {
        name:     session.user.fname ?? session.user.name ?? "User",
        email:    session.user.email ?? "",
        role:     session.user.role  ?? "",
        initials: (session.user.fname?.[0] ?? "U").toUpperCase() +
                  (session.user.name?.split(" ")[1]?.[0] ?? ""),
        username: session.user.username ?? session.user.name ?? "user",
      }
    : undefined;

  // ── Static nav (active) ───────────────────────────────────────────────
  const navGroups = getStaticNavForRole(roleCode);

  // ── Server-driven nav (commented out — re-enable when API is ready) ───
  // const rawMenus  = await fetchRoleMenusRaw(roleCode, apiToken);
  // const navGroups = rawMenus.length > 0
  //   ? apiMenusToNavGroups(rawMenus)
  //   : getStaticNavForRole(roleCode);

  return (
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
            ? { username: sidebarUser.username, initials: sidebarUser.initials, role: sidebarUser.role }
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
  );
}
