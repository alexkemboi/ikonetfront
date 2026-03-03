import type { ReactNode } from "react";
import Sidebar from "./_components/Sidebar";
import TopBar from "./_components/TopBar";
import { adminNavGroups } from "@/config/nav-admin";

/**
 * Dashboard shell — server component.
 *
 * To build a different portal (e.g. customer portal) with a different sidebar:
 *   1. Create a new nav config:  config/nav-customer.ts
 *   2. Create a new layout:      app/(customer)/layout.tsx
 *   3. Pass the new config:      <Sidebar navGroups={customerNavGroups} />
 *
 * The Sidebar component itself never needs to change.
 */

// Placeholder user — replace with session data when auth is wired up
const CURRENT_USER = {
  name: "John Kamau",
  email: "john@beesmart.co.ke",
  role: "Admin",
  initials: "JK",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar receives the nav config — swap adminNavGroups for any other config */}
      <Sidebar
        navGroups={adminNavGroups}
        brandName="Beesmart"
        user={CURRENT_USER}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          notificationCount={5}
          user={{ name: CURRENT_USER.name, initials: CURRENT_USER.initials, role: CURRENT_USER.role }}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
