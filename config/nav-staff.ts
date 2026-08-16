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
      {
        href: "/customers",
        label: "Subscribers",
        icon: "users",
        children: [{ href: "/customers/all", label: "Directory", icon: "users" }],
      },
      { href: "/portal/pppoe", label: "PPPoE Clients", icon: "wifi" },
    ],
  },
  {
    label: "Network",
    items: [
      { href: "/network/mikrotik", label: "MikroTik Devices", icon: "router" },
      { href: "/network/routers", label: "Routers (Edge)", icon: "server" },
      { href: "/network/routers/setup", label: "Link MikroTik", icon: "router" },
      { href: "/network/equipment", label: "Equipment", icon: "package" },
      { href: "/network/live-sessions", label: "Live Sessions", icon: "activity" },
    ],
  },
];
