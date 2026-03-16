import type { NavGroup } from "@/lib/nav";

/**
 * Admin / Staff navigation config.
 * Swap this out (e.g. nav-customer.ts) to get a completely different sidebar.
 */
export const adminNavGroups: NavGroup[] = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "layout-dashboard", exact: true },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/billing",   label: "Billing",   icon: "receipt"  },
      { href: "/customers", label: "Customers", icon: "users"    },
      { href: "/network",   label: "Network",   icon: "network"  },
    ],
  },
  {
    label: "Operate",
    items: [
      { href: "/support", label: "Support", icon: "headphones", badge: 5 },
      { href: "/reports", label: "Reports", icon: "bar-chart-3"           },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/system/internet-packages", label: "Internet Packages", icon: "wifi"          },
      { href: "/system/access",            label: "Access Control",    icon: "shield-check"  },
    ],
  },
  {
    label: "Admin",
    items: [
      {
        href: "/settings",
        label: "Settings",
        icon: "settings",
        children: [
          { href: "/settings/roles",  label: "Roles & Permissions", icon: "shield"   },
          { href: "/settings/users",  label: "Staff Users",         icon: "user-cog" },
          { href: "/settings/system", label: "System",              icon: "server"   },
        ],
      },
    ],
  },
];
