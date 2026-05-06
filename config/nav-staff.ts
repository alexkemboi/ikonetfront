import type { NavGroup } from "@/lib/nav";

export const staffNavGroups: NavGroup[] = [
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
      { href: "/network/mikrotik", label: "MikroTik Devices", icon: "router" },
    ],
  },
];
