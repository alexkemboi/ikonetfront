import { describe, expect, it } from "vitest";
import { buildDisplayTree } from "@/app/(dashboard)/system/access/_components/RolesClient";
import type { MenuNode } from "@/lib/nav";
import type { NavLayoutRow } from "@/lib/types/roles";

const item = (idxno: number, label: string, permissionKey: string, kind = "MENU", children?: MenuNode["children"]): MenuNode => ({
  idxno, menuItemId: idxno, key: String(idxno), kind, permissionKey, route: `/r${idxno}`, label, icon: "", children,
});
const row = (id: number, label: string, parentId: number | null, permissionKey: string | null, displayOrder: number, portal = "STAFF"): NavLayoutRow => ({
  id, menuKey: `k${id}`, label, parentId, portal, route: null, displayOrder, isActive: true, permissionKey,
});

// catalogue: its own names and nesting, unlike the sidebar
const catalogue: MenuNode[] = [
  item(1, "Admin Dashboard", "MENU_10"),
  item(2, "My Network Devices", "NET", "MENU", [item(3, "routers", "NETWORK_ROUTERS"), item(4, "Network Equipment", "NETWORK_EQUIPMENT")]),
  item(5, "Finance", "FINANCE", "MENU", [item(6, "Billing Records", "FINANCE_INVOICES")]),
  item(7, "Legacy screen", "LEGACY"),
  item(8, "Refund API", "API_REFUND_ROOT", "API"),
];
// sidebar: sections and names as the user sees them
const layout: NavLayoutRow[] = [
  row(100, "Network Management", null, null, 30),
  row(101, "Routers (Edge)", 100, "NETWORK_ROUTERS", 10),
  row(102, "Router Monitoring", 100, "NETWORK_ROUTERS", 20),
  row(103, "Equipment", 100, "NETWORK_EQUIPMENT", 30),
  row(110, "Overview", null, null, 10),
  row(111, "Overview", 110, "MENU_10", 10),
  row(120, "Billing", null, null, 70),
  row(121, "Billing", 120, "FINANCE_INVOICES", 10),
  row(200, "Overview", null, null, 10, "INVESTOR"),
];

describe("Access Control screens follow the sidebar", () => {
  const tree = buildDisplayTree(catalogue, layout);

  it("lists sidebar sections in sidebar order with the sidebar's names", () => {
    expect(tree.map((n) => n.label)).toEqual(["Overview", "Network Management", "Billing", "Other screens", "API · General"]);
    const network = tree.find((n) => n.label === "Network Management")!;
    expect(network.children!.map((c) => c.label)).toEqual(["Routers (Edge) · Router Monitoring", "Equipment"]);
    expect(tree.find((n) => n.label === "Overview")!.children!.map((c) => c.label)).toEqual(["Overview"]);
  });

  it("keeps every catalogue entry exactly once, so a save carries the whole set", () => {
    const keys = tree.flatMap((n) => (n.synthetic ? [] : [n.key]).concat((n.children ?? []).map((c) => c.key)));
    expect(keys.sort()).toEqual(["1", "2", "3", "4", "5", "6", "7", "8"]);
    expect(tree.find((n) => n.label === "Other screens")!.children!.map((c) => c.label)).toEqual(["Finance", "Legacy screen", "My Network Devices"]);
  });
});
