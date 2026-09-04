import type { NavGroup } from "@/lib/nav";

export const investorNavGroups: NavGroup[] = [
  {
    items: [
      {
        href: "/finance/investor",
        label: "Money Flow & Routers",
        icon: "attach_money",
        exact: true,
      },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      { href: "/finance/investor/routers", label: "Assigned Routers", icon: "router" },
    ],
  },
];
