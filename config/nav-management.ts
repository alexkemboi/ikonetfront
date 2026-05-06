import type { NavGroup } from "@/lib/nav";

export const managementNavGroups: NavGroup[] = [
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
    label: "System",
    items: [
      { href: "/system/packages", label: "Packages", icon: "wifi" },
    ],
  },
];
