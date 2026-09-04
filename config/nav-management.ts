import type { NavGroup } from "@/lib/nav";

export const managementNavGroups: NavGroup[] = [
  {
    items: [
      { href: "/analytics", label: "Dashboard", icon: "layout-dashboard", exact: true },
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
    label: "Finance",
    items: [
      { href: "/finance", label: "Executive Dashboard", icon: "bar-chart-3" },
      { href: "/finance/ledger", label: "Chart of Accounts", icon: "book-open" },
      { href: "/finance/expenses", label: "Expenses", icon: "receipt" },
      { href: "/finance/statements", label: "Statements", icon: "file-text" },
      { href: "/finance/vouchers", label: "Vouchers", icon: "credit-card" },
      { href: "/finance/reconciliation", label: "M-Pesa Reconciliation", icon: "rotate-cw" },
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
