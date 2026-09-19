import { type ReactNode } from "react";
import { getSettingsCatalog } from "@/actions/settings";
import SettingsShell from "./_components/SettingsShell";

/**
 * Two-pane settings catalog (Track 6 Phase 3). The left pane is a searchable
 * category tree; the right pane renders either the selected catalog panel or
 * the nested route content (e.g. /settings/alerts).
 */
export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const catalog = await getSettingsCatalog();
  return <SettingsShell catalog={catalog}>{children}</SettingsShell>;
}