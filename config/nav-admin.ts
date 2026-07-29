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
      {
        href: "/portal",
        label: "Portal",
        icon: "globe",
        children: [
          { href: "/portal/pppoe", label: "PPPoE Clients", icon: "wifi" },
        ],
      },
    ],
  },
  {
    label: "Network",
    items: [
      { href: "/network/dashboard", label: "NOC Dashboard", icon: "activity" },
      { href: "/network/regions",   label: "Regions",       icon: "globe"    },
      { href: "/network/locations", label: "Locations",     icon: "map-pin"  },
      { href: "/network/stations",  label: "Stations/POPs", icon: "database" },
      { href: "/network/routers",  label: "Routers (Edge)", icon: "server" },
      { href: "/network/topology",  label: "Network Topology", icon: "network" },
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
      { href: "/system/staff-users", label: "Staff Users", icon: "user-cog" },
      { href: "/system/access", label: "Access Control", icon: "shield-check" },
      { href: "/system/audit", label: "Audit Logs", icon: "scroll-text" },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        href: "/settings",
        label: "Settings",
        icon: "settings",
        children: [
          { href: "/settings/alerts", label: "Alert Channels", icon: "bell" },
        ],
      },
    ],
  },
];
