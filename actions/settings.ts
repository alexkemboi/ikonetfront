"use server";

import { apiFetch } from "@/lib/apiClient";

export type SettingsEntry = {
  key: string;
  title: string;
  description: string;
  keywords: string[];
  panel: string;
};

export type SettingsSection = {
  id: string;
  title: string;
  description: string;
  entries: SettingsEntry[];
};

export type GatewayStatus = {
  companyCode: string;
  companyName: string;
  accountType: string;
  provider: string;
  shortCode: string;
  status: string;
  active: boolean;
  useEnvBackend: boolean;
};

export type ProviderStatus = {
  id: number;
  name: string;
  channel: string;
  status: string;
  active: boolean;
};

export type AppSettingValue = {
  key: string;
  value: string | null;
  valueType: string;
  isSecret: boolean;
  configured: boolean;
  description: string;
};

export type SettingsCatalog = {
  sections: SettingsSection[];
  gateways: GatewayStatus[];
  providers: ProviderStatus[];
  settings: Record<string, AppSettingValue>;
  generatedAtMs: number;
};

export type GatewayTestResult = { ok: boolean; message: string; latencyMs: number };

export async function getSettingsCatalog(): Promise<SettingsCatalog | null> {
  const res = await apiFetch<SettingsCatalog>("/settings/catalog", {
    auth: "required",
    cache: "no-store",
  });
  return res.success && res.data ? res.data : null;
}

export async function getSettingItem(key: string): Promise<AppSettingValue | null> {
  const res = await apiFetch<AppSettingValue>(`/settings/items/${encodeURIComponent(key)}`, {
    auth: "required",
    cache: "no-store",
  });
  return res.success && res.data ? res.data : null;
}

export async function updateSettingItem(
  key: string,
  value: string,
  stepUpToken?: string
): Promise<{ success: boolean; status?: number; message: string; data?: AppSettingValue }> {
  const res = await apiFetch<AppSettingValue>(`/settings/items/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: { value },
    auth: "required",
    stepUpToken,
  });
  return {
    success: res.success,
    status: res.status,
    message: res.message ?? (res.success ? "Setting updated" : "Failed to update setting"),
    data: res.data ?? undefined,
  };
}

export async function testGatewayCredentials(
  companyCode: string
): Promise<GatewayTestResult | null> {
  const res = await apiFetch<GatewayTestResult>(`/settings/gateways/${encodeURIComponent(companyCode)}/test`, {
    method: "POST",
    auth: "required",
    cache: "no-store",
  });
  return res.success && res.data ? res.data : null;
}