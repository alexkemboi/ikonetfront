export type EquipmentType = "router" | "modem" | "ont_onu" | "cable" | "switch" | "access_point";
export type EquipmentStatus = "in_stock" | "assigned" | "returned" | "damaged" | "sold";

export interface EquipmentItem {
  id: string;
  name: string; // e.g. "MikroTik hAP ac3"
  type: EquipmentType;
  model?: string;
  serialNumber?: string;
  notes?: string;
  assignedSubscriberId?: string;
  assignedSubscriberName?: string;
  status: EquipmentStatus;
  costPrice: number; // Cost basis
  paidSoFar: number; // Amount collected against gear
  createdAt: string;
}

export interface EquipmentKpis {
  inStockCount: number;
  assignedCount: number;
  inventoryCostBasis: number;
  totalCollected: number;
  allCount: number;
  returnedCount: number;
  damagedCount: number;
  soldCount: number;
}

export interface AddEquipmentRequest {
  name: string;
  type: EquipmentType;
  model?: string;
  serialNumber?: string;
  notes?: string;
  assignedSubscriberId?: string;
  status: EquipmentStatus;
  costPrice: number;
  paidSoFar: number;
}