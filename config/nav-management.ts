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
      { href: "/portal/pppoe", label: "PPPoE Clients", icon: "wifi" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/finance", label: "Executive Dashboard", icon: "bar-chart-3" },
      { href: "/finance/ledger", label: "Chart of Accounts", icon: "book-open" },
      { href: "/finance/expenses", label: "Expenses", icon: "receipt" },
      { href: "/finance/statements", label: "Statements", icon: "file-text" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/system/packages", label: "Packages", icon: "package" },
    ],
  },
];
