import { type ReactNode } from "react";
import Sidebar from "./_components/Sidebar";
import TopBar from "./_components/TopBar";
import { auth } from "@/lib/auth";
import { fetchRoleMenusRaw, apiMenusToNavGroups, getStaticNavForRole } from "@/lib/data/nav";

/**
 * Dashboard shell — server component.
 *
 * Nav is fetched from the API using the logged-in user's role code.
 * Cached with `next: { tags: ["nav-menus"] }` — call revalidateTag("nav-menus")
 * to refresh after permission changes.
 *
 * To build a different portal (e.g. customer portal) with a different sidebar:
 *   1. Create a new layout:  app/(customer)/layout.tsx
 *   2. Fetch menus for the customer role and pass to <Sidebar>
 *   The Sidebar component itself never needs to change.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  const roleCode = session?.user?.role    ?? "";
  const apiToken = session?.user?.apiToken ?? "";

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

  // Fetch nav from API — fall back to static config when API returns nothing
  const rawMenus  = await fetchRoleMenusRaw(roleCode, apiToken);
  const navGroups = rawMenus.length > 0
    ? apiMenusToNavGroups(rawMenus)
    : getStaticNavForRole(roleCode);

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
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
