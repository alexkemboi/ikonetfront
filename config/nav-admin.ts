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
      {
        href: "/network",
        label: "Network",
        icon: "network",
        children: [
          { href: "/network/mikrotik",   label: "MikroTik Devices", icon: "router"  },
          { href: "/network/routers",    label: "Network Routers",  icon: "server"  },
          { href: "/network/ip-mapping", label: "IP Mapping",       icon: "map-pin" },
        ],
      },
    ],
  },
  {
    label: "Communications",
    items: [
      { href: "/communications/bulk-email", label: "Bulk Email", icon: "mail" },
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
