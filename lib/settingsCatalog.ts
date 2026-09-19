"use client";

import { useMemo } from "react";
import type { SettingsCatalog, SettingsEntry, SettingsSection } from "@/actions/settings";

/**
 * Filters catalog sections/entries by title, description and keywords
 * (e.g. typing "M-Pesa" or "Daraja" isolates Payments & Gateways).
 */
export function useSettingsSearch(catalog: SettingsCatalog | null, query: string): SettingsSection[] {
  return useMemo(() => {
    if (!catalog) return [];
    const q = query.trim().toLowerCase();
    if (!q) return catalog.sections;
    return catalog.sections
      .map((section) => ({
        ...section,
        entries: section.entries.filter(
          (entry) =>
            entry.title.toLowerCase().includes(q) ||
            entry.description.toLowerCase().includes(q) ||
            entry.keywords.some((k) => k.toLowerCase().includes(q))
        ),
      }))
      .filter((section) => section.entries.length > 0);
  }, [catalog, query]);
}

export type PanelKind =
  | "gateways"
  | "providers"
  | "setting"
  | "link"
  | "nav"
  | "none";

export function panelFor(entry: SettingsEntry | undefined): PanelKind {
  if (!entry) return "none";
  const panel = entry.panel;
  if (panel === "billing/gateways") return "gateways";
  if (panel === "billing/sms") return "providers";
  if (panel.startsWith("policies/compensation") || panel === "integrations/webhooks") return "setting";
  return "link";
}

export const APP_SETTING_KEYS = new Set([
  "outage.compensation.notify-by-default",
  "integrations.webhooks.endpoint",
  "integrations.webhooks.signing-secret",
]);