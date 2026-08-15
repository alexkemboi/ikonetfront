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
      { href: "/network/routers", label: "Routers (Edge)", icon: "server" },
      { href: "/network/routers/setup", label: "Link MikroTik", icon: "router" },
      { href: "/network/equipment", label: "Equipment", icon: "package" },
      { href: "/network/live-sessions", label: "Live Sessions", icon: "activity" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/finance", label: "Executive Dashboard", icon: "bar-chart-3" },
      { href: "/finance/ledger", label: "Chart of Accounts", icon: "book-open" },
      { href: "/finance/expenses", label: "Expenses", icon: "receipt" },
      { href: "/finance/statements", label: "Statements", icon: "file-text" },
      { href: "/finance/vouchers", label: "Vouchers", icon: "credit-card" },
      {
        href: "/finance/billing",
        label: "Billing",
        icon: "credit-card",
        children: [
          { href: "/finance/billing/payments", label: "Payments", icon: "credit-card" },
          { href: "/finance/billing/invoices", label: "Invoices", icon: "file-text" },
        ],
      },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/analytics", label: "Analytics", icon: "bar-chart-3" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/system/packages", label: "Packages", icon: "package" },
    ],
  },
];
