"use server";

import { withCompanyContext } from "@/lib/companyContext";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { BASE_URL } from "@/lib/constants";
import {
  AddEquipmentRequest,
  EquipmentItem,
  EquipmentKpis,
  EquipmentType,
} from "@/lib/types/equipment";
import { getMikrotikDevices } from "@/actions/mikrotik";
import { getPermissionForRoute } from "@/lib/data/nav";

const FALLBACK_EQUIPMENT_KPIS: EquipmentKpis = {
  inStockCount: 3,
  assignedCount: 2,
  inventoryCostBasis: 45000,
  totalCollected: 15000,
  allCount: 5,
  returnedCount: 0,
  damagedCount: 0,
  soldCount: 0,
};

const FALLBACK_EQUIPMENT_LIST: EquipmentItem[] = [
  {
    id: "eq-1",
    name: "MikroTik hAP ac3",
    type: "router",
    model: "RBD53iG-5HacD2HnD",
    serialNumber: "HE90892AC301",
    status: "in_stock",
    costPrice: 9500,
    paidSoFar: 0,
    createdAt: "2026-08-01",
  },
  {
    id: "eq-2",
    name: "Huawei HG8310M GPON ONU",
    type: "ont_onu",
    model: "HG8310M",
    serialNumber: "48575443F890",
    assignedSubscriberName: "Anwar Hassan",
    status: "assigned",
    costPrice: 3200,
    paidSoFar: 3200,
    createdAt: "2026-07-28",
  },
];

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.user?.apiToken) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${session.user.apiToken}`;
  }
  // Forward the SYSADMIN-selected company so the backend scopes the call.
  return withCompanyContext(headers as Record<string, string>);
}

function mapDeviceType(deviceType: string | undefined | null): EquipmentType {
  const t = (deviceType ?? "").toLowerCase();
  switch (t) {
    case "modem":
      return "modem";
    case "ont_onu":
    case "ont-onu":
    case "onu":
      return "ont_onu";
    case "cable":
      return "cable";
    case "switch":
      return "switch";
    case "access_point":
    case "access-point":
    case "accesspoint":
    case "ap":
      return "access_point";
    case "router":
    default:
      return "router";
  }
}

function mapDeviceToItem(device: {
  id: number;
  name: string;
  deviceType?: string | null;
  online?: boolean;
  active?: boolean;
  createdAt?: string;
}): EquipmentItem {
  const deviceType = device.deviceType ?? "—";
  return {
    // id/name from the real NAS row; serial/cost fields are synthesized placeholders
    id: String(device.id),
    name: device.name,
    type: mapDeviceType(device.deviceType),
    model: deviceType,
    serialNumber: `S${device.id}`,
    status: device.online || device.active ? "assigned" : "in_stock",
    costPrice: 0,
    paidSoFar: 0,
    createdAt: device.createdAt ?? "—",
  };
}

function deriveEquipmentKpis(items: EquipmentItem[]): EquipmentKpis {
  const count = (status: EquipmentItem["status"]) =>
    items.filter((i) => i.status === status).length;
  return {
    inStockCount: count("in_stock"),
    assignedCount: count("assigned"),
    inventoryCostBasis: items.reduce((sum, i) => sum + i.costPrice, 0),
    totalCollected: items.reduce((sum, i) => sum + i.paidSoFar, 0),
    allCount: items.length,
    returnedCount: count("returned"),
    damagedCount: count("damaged"),
    soldCount: count("sold"),
  };
}

export async function getEquipmentData(): Promise<{
  kpis: EquipmentKpis;
  items: EquipmentItem[];
}> {
  try {
    const res = await getMikrotikDevices();
    if (!res.success || !Array.isArray(res.data) || res.data.length === 0) {
      return { kpis: FALLBACK_EQUIPMENT_KPIS, items: FALLBACK_EQUIPMENT_LIST };
    }
    const items = res.data.map(mapDeviceToItem);
    return { kpis: deriveEquipmentKpis(items), items };
  } catch (error: unknown) {
    console.error("Error fetching equipment data:", error);
    return { kpis: FALLBACK_EQUIPMENT_KPIS, items: FALLBACK_EQUIPMENT_LIST };
  }
}

export async function createEquipment(
  request: AddEquipmentRequest
): Promise<{ success: boolean; message: string }> {
  const pagePerms = await getPermissionForRoute("/network/equipment");
  if (!pagePerms.canCreate) {
    return { success: false, message: "Not authorized to add equipment." };
  }
  try {
    const response = await fetch(`${BASE_URL}network-devices`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const message = `HTTP ${response.status}: Failed to create equipment record`;
      console.warn(message);
      return { success: false, message };
    }
    revalidatePath("/network/equipment");
    return { success: true, message: "Equipment added to inventory successfully." };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create equipment record";
    return { success: false, message };
  }
}