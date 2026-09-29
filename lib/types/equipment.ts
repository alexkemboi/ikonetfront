export type EquipmentType = "ROUTER" | "SWITCH" | "CPE_MODEM" | "ONU" | "ANTENNA" | "SMART_TV" | "WIFI_AP" | "CABLE";
export type EquipmentStatus = "IN_STOCK" | "INSTALLED" | "RETURNED" | "DAMAGED" | "SOLD" | "RMA";
export type EquipmentDataQuality = "VERIFIED" | "PLACEHOLDER" | "MISSING";

export interface EquipmentItem {
  id: number;
  name: string;
  assetTag: string;
  type: EquipmentType;
  model: string | null;
  serialNumber: string | null;
  status: EquipmentStatus;
  costPrice: string;
  paidSoFar: string;
  unpaidBalance: string;
  createdAt: string;
  acquiredAt: string | null;
  installedAt: string | null;
  assignedSubscriberName: string | null;
  returned: boolean;
  damaged: boolean;
  sold: boolean;
  dataQuality: EquipmentDataQuality;
  needsCorrection: boolean;
}

export interface EquipmentKpis {
  totalAssets: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  totalCost: string;
  totalPaid: string;
  totalUnpaid: string;
  installedThisMonthCount: number;
  damagedCount: number;
  needsCorrectionCount: number;
}

export interface EquipmentPage {
  content: EquipmentItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface EquipmentListResult {
  success: boolean;
  requestId?: string;
  message?: string;
  kpis: EquipmentKpis | null;
  items: EquipmentPage | null;
}

export interface AddEquipmentRequest {
  assetTag: string;
  type: EquipmentType;
  status: EquipmentStatus;
  model?: string | null;
  serialNumber?: string | null;
  costPrice: string;
  paidSoFar: string;
  acquiredAt?: string | null;
  companyId?: string | null;
  stationId?: string | null;
  linkedNetworkDeviceId?: number | null;
  linkedNetworkRouterIdxno?: number | null;
  dataQuality?: EquipmentDataQuality;
  reason?: string;
}
