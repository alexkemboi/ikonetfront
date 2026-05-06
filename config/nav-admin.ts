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
          { href: "/network/mikrotik", label: "MikroTik Devices", icon: "router" },
        ],
      },
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
      { href: "/system/packages", label: "Packages", icon: "wifi" },
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
