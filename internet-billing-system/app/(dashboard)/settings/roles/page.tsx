import RolesClient from "./_components/RolesClient";
import { auth } from "@/lib/auth";
import { getRolesAction, getRoleMenusAction } from "@/actions/roles";
import type { RoleMenu } from "@/lib/types/roles";

export const metadata = { title: "Roles & Permissions — Beesmart" };

// ── UI types ────────────────────────────────────────────────────────────
// These are the shapes RolesClient works with — independent of API shapes.

export type RoleUser = {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive";
  initials: string;
  joinedAt: string;
};

export type Role = {
  id: string;
  name: string;
  description: string;
  userCount: number;
  /** Permission IDs this role has access to (keyed to MENU_TREE node IDs) */
  permissions: string[];
  users: RoleUser[];
  createdAt: string;
};

export type MenuNode = {
  id: string;
  label: string;
  icon: string;
  children?: Omit<MenuNode, "children">[];
};

// ── Static permission tree (UI definition — not from the API) ───────────
const MENU_TREE: MenuNode[] = [
  {
    id: "dashboard", label: "Dashboard", icon: "layout-dashboard",
    children: [
      { id: "dashboard.overview",  label: "Overview",  icon: "home"      },
      { id: "dashboard.analytics", label: "Analytics", icon: "pie-chart" },
    ],
  },
  {
    id: "billing", label: "Billing", icon: "receipt",
    children: [
      { id: "billing.invoices", label: "Invoices",          icon: "file-text"   },
      { id: "billing.payments", label: "Payments",          icon: "credit-card" },
      { id: "billing.dunning",  label: "Dunning",           icon: "bell"        },
      { id: "billing.reports",  label: "Financial Reports", icon: "bar-chart-3" },
    ],
  },
  {
    id: "customers", label: "Customers", icon: "users",
    children: [
      { id: "customers.pppoe",   label: "PPPoE Subscribers", icon: "users"   },
      { id: "customers.hotspot", label: "Hotspot Users",      icon: "wifi"    },
      { id: "customers.plans",   label: "Manage Plans",       icon: "package" },
    ],
  },
  {
    id: "network", label: "Network", icon: "network",
    children: [
      { id: "network.routers",       label: "Routers",         icon: "router"   },
      { id: "network.pools",         label: "IP Pools",        icon: "server"   },
      { id: "network.hotspot_zones", label: "Hotspot Zones",   icon: "wifi"     },
      { id: "network.sessions",      label: "Active Sessions", icon: "activity" },
    ],
  },
  {
    id: "support", label: "Support", icon: "headphones",
    children: [
      { id: "support.tickets", label: "Tickets",   icon: "life-buoy"      },
      { id: "support.chat",    label: "Live Chat", icon: "message-circle" },
    ],
  },
  {
    id: "reports", label: "Reports", icon: "bar-chart-3",
    children: [
      { id: "reports.financial", label: "Financial Reports", icon: "file-text" },
      { id: "reports.usage",     label: "Usage Reports",     icon: "activity"  },
      { id: "reports.audit",     label: "Audit Log",         icon: "shield"    },
    ],
  },
  {
    id: "settings", label: "Settings", icon: "settings",
    children: [
      { id: "settings.roles",        label: "Roles & Permissions", icon: "shield"   },
      { id: "settings.users",        label: "Staff Users",         icon: "user-cog" },
      { id: "settings.system",       label: "System Settings",     icon: "server"   },
      { id: "settings.integrations", label: "Integrations",        icon: "plug"     },
    ],
  },
];

// Extract a stable permission ID from a menu item returned by the API.
// Extend this mapping once the real menu shape is confirmed.
function extractPermId(menu: RoleMenu): string {
  return String(menu.menuCode ?? menu.menuId ?? menu.name ?? "");
}

// ── Page ────────────────────────────────────────────────────────────────
export default async function RolesPage() {
  await auth(); // ensure session is valid (proxy handles redirect if not)

  let roles: Role[] = [];

  try {
    const rolesResult = await getRolesAction();
    const apiRoles = rolesResult.success ? rolesResult.data : [];

    // Fetch menus for all roles in parallel
    const menusResults = await Promise.all(
      apiRoles.map((r) => getRoleMenusAction(r.roleCode))
    );

    roles = apiRoles.map((apiRole, i) => ({
      id:          apiRole.roleCode,
      name:        apiRole.name,
      description: apiRole.description,
      userCount:   0,          // users endpoint not yet wired
      permissions: (menusResults[i]?.data ?? [])
        .map(extractPermId)
        .filter(Boolean),
      users:       [],          // users endpoint not yet wired
      createdAt:   apiRole.createdAt ?? "",
    }));
  } catch {
    // API unreachable — render with empty state; user sees the empty list
    roles = [];
  }

  return (
    <div className="p-6 h-full">
      <RolesClient roles={roles} menuTree={MENU_TREE} />
    </div>
  );
}
