import type { NavGroup } from "@/lib/nav";

export const adminNavGroups: NavGroup[] = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "layout-dashboard", exact: true },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/customers/all", label: "All Customers", icon: "users" },
      { href: "/portal/pppoe", label: "PPPoE Clients", icon: "wifi" },
    ],
  },
  {
    label: "Network",
    items: [
      { href: "/network/regions",   label: "Regions",       icon: "globe"    },
      { href: "/network/locations", label: "Locations",     icon: "map-pin"  },
      { href: "/network/stations",  label: "Stations/POPs", icon: "database" },
      { href: "/network/routers",  label: "Routers (Edge)", icon: "server" },
    ],
  },
  {
    label: "Communications",
    items: [
      { href: "/communications/bulk-email", label: "Bulk Email", icon: "mail" },
    ],
  },
  {
    label: "Support",
    items: [
      { href: "/customers/tickets", label: "Tickets", icon: "headphones" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/finance", label: "Revenue Overview", icon: "bar-chart-3" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/system/packages", label: "Packages", icon: "package" },
      { href: "/system/users", label: "System Users", icon: "user-cog" },
      { href: "/system/access", label: "Access Control", icon: "shield-check" },
      { href: "/system/audit", label: "Audit Logs", icon: "scroll-text" },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/settings/alerts", label: "Alert Channels", icon: "bell" },
    ],
  },
];
