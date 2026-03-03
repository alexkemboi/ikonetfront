import RolesClient from "./_components/RolesClient";

export const metadata = { title: "Roles & Permissions — Beesmart" };

// ── Data types ─────────────────────────────────────────────────────────
// These types define the shape of what the API will eventually return.
// When wiring up the API, fetch data here and pass it as props to RolesClient.
// Use Next.js `revalidate` or `unstable_cache` to control staleness.

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
  /** Permission IDs this role has access to */
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

// ── Dummy data (replace with API fetch when ready) ─────────────────────

const MENU_TREE: MenuNode[] = [
  {
    id: "dashboard", label: "Dashboard", icon: "layout-dashboard",
    children: [
      { id: "dashboard.overview",  label: "Overview",  icon: "home"       },
      { id: "dashboard.analytics", label: "Analytics", icon: "pie-chart"  },
    ],
  },
  {
    id: "billing", label: "Billing", icon: "receipt",
    children: [
      { id: "billing.invoices",  label: "Invoices",          icon: "file-text"   },
      { id: "billing.payments",  label: "Payments",          icon: "credit-card" },
      { id: "billing.dunning",   label: "Dunning",           icon: "bell"        },
      { id: "billing.reports",   label: "Financial Reports", icon: "bar-chart-3" },
    ],
  },
  {
    id: "customers", label: "Customers", icon: "users",
    children: [
      { id: "customers.pppoe",   label: "PPPoE Subscribers", icon: "users"    },
      { id: "customers.hotspot", label: "Hotspot Users",      icon: "wifi"     },
      { id: "customers.plans",   label: "Manage Plans",       icon: "package"  },
    ],
  },
  {
    id: "network", label: "Network", icon: "network",
    children: [
      { id: "network.routers",       label: "Routers",       icon: "router"    },
      { id: "network.pools",         label: "IP Pools",      icon: "server"    },
      { id: "network.hotspot_zones", label: "Hotspot Zones", icon: "wifi"      },
      { id: "network.sessions",      label: "Active Sessions", icon: "activity" },
    ],
  },
  {
    id: "support", label: "Support", icon: "headphones",
    children: [
      { id: "support.tickets", label: "Tickets",   icon: "life-buoy" },
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

const allPermissions = MENU_TREE.flatMap((m) => [
  m.id,
  ...(m.children?.map((c) => c.id) ?? []),
]);

const billingPerms = ["dashboard", "dashboard.overview", "billing", "billing.invoices", "billing.payments", "billing.reports", "billing.dunning", "reports.financial"];
const mgmtPerms    = ["dashboard", "dashboard.overview", "dashboard.analytics", "reports", "reports.financial", "reports.usage", "customers", "customers.pppoe", "customers.hotspot"];
const supportPerms = ["dashboard", "dashboard.overview", "support", "support.tickets", "support.chat", "customers", "customers.pppoe", "customers.hotspot"];
const agentPerms   = ["dashboard", "dashboard.overview", "support.tickets", "support.chat"];

const ROLES: Role[] = [
  {
    id: "admin",
    name: "Admin",
    description: "Full system access. Can manage all modules, users, and settings.",
    userCount: 2,
    permissions: allPermissions,
    createdAt: "2024-01-15",
    users: [
      { id: "u1", name: "John Kamau",   email: "john@beesmart.co.ke",   status: "active",   initials: "JK", joinedAt: "2024-01-15" },
      { id: "u2", name: "Grace Wanjiku",email: "grace@beesmart.co.ke",  status: "active",   initials: "GW", joinedAt: "2024-02-01" },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    description: "Manages billing, invoices, payments, and financial reports.",
    userCount: 3,
    permissions: billingPerms,
    createdAt: "2024-01-20",
    users: [
      { id: "u3", name: "Peter Ochieng", email: "peter@beesmart.co.ke",  status: "active",   initials: "PO", joinedAt: "2024-01-20" },
      { id: "u4", name: "Mary Njeri",    email: "mary@beesmart.co.ke",   status: "active",   initials: "MN", joinedAt: "2024-03-10" },
      { id: "u5", name: "David Mutua",   email: "david@beesmart.co.ke",  status: "inactive", initials: "DM", joinedAt: "2024-03-15" },
    ],
  },
  {
    id: "management",
    name: "Management",
    description: "View-only access to dashboards, analytics, and reports.",
    userCount: 2,
    permissions: mgmtPerms,
    createdAt: "2024-01-22",
    users: [
      { id: "u6", name: "Sarah Otieno",  email: "sarah@beesmart.co.ke",  status: "active",   initials: "SO", joinedAt: "2024-01-22" },
      { id: "u7", name: "James Kariuki", email: "james@beesmart.co.ke",  status: "active",   initials: "JK", joinedAt: "2024-04-01" },
    ],
  },
  {
    id: "support",
    name: "Support",
    description: "Handles customer support tickets and live chat.",
    userCount: 8,
    permissions: supportPerms,
    createdAt: "2024-02-01",
    users: [
      { id: "u8",  name: "Alice Mwangi",  email: "alice@beesmart.co.ke",  status: "active",   initials: "AM", joinedAt: "2024-02-01" },
      { id: "u9",  name: "Brian Omondi",  email: "brian@beesmart.co.ke",  status: "active",   initials: "BO", joinedAt: "2024-02-15" },
      { id: "u10", name: "Cynthia Auma",  email: "cynthia@beesmart.co.ke",status: "active",   initials: "CA", joinedAt: "2024-03-01" },
    ],
  },
  {
    id: "cs-agent",
    name: "CS Agent",
    description: "Limited to support tickets and chat only. No billing access.",
    userCount: 12,
    permissions: agentPerms,
    createdAt: "2024-02-10",
    users: [
      { id: "u11", name: "Dennis Kiprop", email: "dennis@beesmart.co.ke", status: "active",   initials: "DK", joinedAt: "2024-02-10" },
      { id: "u12", name: "Faith Chebet",  email: "faith@beesmart.co.ke",  status: "inactive", initials: "FC", joinedAt: "2024-02-20" },
    ],
  },
];

// ── Page ────────────────────────────────────────────────────────────────
export default function RolesPage() {
  return (
    <div className="p-6 h-full">
      <RolesClient roles={ROLES} menuTree={MENU_TREE} />
    </div>
  );
}
