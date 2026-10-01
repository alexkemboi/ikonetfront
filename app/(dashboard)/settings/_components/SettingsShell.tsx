"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowUpRight, Settings2, ShieldCheck, TestTube2 } from "lucide-react";
import { withStepUp } from "@/lib/stepUp";
import {
  testGatewayCredentials,
  updateSettingItem,
  type AppSettingValue,
  type SettingsCatalog,
  type SettingsEntry,
} from "@/actions/settings";
import { panelFor, useSettingsSearch } from "@/lib/settingsCatalog";
import type { ReactNode } from "react";

const LINK_PANELS: Record<string, string> = {
  "networking/domain": "/system/companies",
  "networking/pppoe": "/system/packages",
  "networking/captive": "/network/routers",
  "policies/alerts": "/settings/alerts",
  "integrations/api": "/swagger",
  "security/profile": "/system/users",
  "security/password": "/system/users",
};

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        active
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-zinc-500/15 text-zinc-500"
      }`}
    >
      {active ? "Connected" : "Inactive"}
    </span>
  );
}

function SettingToggle({ setting }: { setting: AppSettingValue | undefined }) {
  const [value, setValue] = useState(setting?.value === "true");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function toggle() {
    const next = !value;
    setBusy(true);
    setMessage(null);
    const res = await withStepUp(
      (token) => updateSettingItem(setting!.key, String(next), token),
      "Updating a settings value requires re-authentication."
    );
    setBusy(false);
    if (res.success) {
      setValue(next);
      setMessage("Saved.");
      setTimeout(() => setMessage(null), 2000);
    } else {
      setMessage(res.message);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
      <div>
        <p className="text-sm font-medium text-foreground">{setting?.description ?? setting?.key}</p>
        <p className="text-xs text-muted-foreground">{setting?.configured ? "Configured" : "Not set"}</p>
      </div>
      <div className="flex items-center gap-2">
        {message && <span className="text-[10px] text-muted-foreground">{message}</span>}
        <button
          type="button"
          disabled={busy || !setting}
          onClick={toggle}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            value ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
          } disabled:opacity-50`}
          aria-pressed={value}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${value ? "left-[22px]" : "left-0.5"}`}
          />
        </button>
      </div>
    </div>
  );
}

function GatewaysPanel({ catalog }: { catalog: SettingsCatalog }) {
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, string> | null>(null);

  async function test(code: string) {
    setTesting(code);
    setTestResult(null);
    const result = await testGatewayCredentials(code);
    setTesting(null);
    setTestResult(result ? { [code]: result.ok ? "OK — access token issued" : result.message } : null);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        M-Pesa / payment accounts (channel-powered from the companies surface). Credential edits
        require step-up re-authentication.
      </p>
      {catalog.gateways.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
          No payment accounts configured yet. Add one under Companies → Payment accounts.
        </p>
      )}
      {catalog.gateways.map((gateway) => (
        <div key={gateway.companyCode + gateway.accountType} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {gateway.companyName ?? gateway.companyCode} · {gateway.accountType}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {gateway.provider} — Paybill {gateway.shortCode}
                {gateway.useEnvBackend ? " (env backend)" : ""}
              </p>
            </div>
            <StatusPill active={gateway.active} />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              disabled={testing !== null}
              onClick={() => test(gateway.companyCode)}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium hover:bg-accent disabled:opacity-50"
            >
              <TestTube2 className="h-3 w-3" />
              {testing === gateway.companyCode ? "Probing…" : "Test Daraja"}
            </button>
            <a
              href={`/system/companies`}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
            >
              Configure credentials <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
          {testResult?.[gateway.companyCode] && (
            <p className="mt-2 text-[11px] text-muted-foreground">{testResult[gateway.companyCode]}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function ProvidersPanel({ catalog }: { catalog: SettingsCatalog }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        SMS / notification channels. Provider credential writes require step-up re-authentication.
      </p>
      {catalog.providers.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
          No notification providers configured yet.
        </p>
      )}
      {catalog.providers.map((provider) => (
        <div key={provider.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
          <div>
            <p className="text-sm font-medium text-foreground">{provider.name}</p>
            <p className="text-xs text-muted-foreground">{provider.channel}</p>
          </div>
          <StatusPill active={provider.active} />
        </div>
      ))}
    </div>
  );
}

function PanelView({ entry, catalog }: { entry: SettingsEntry; catalog: SettingsCatalog }) {
  const kind = panelFor(entry);
  if (kind === "gateways") {
    return <GatewaysPanel catalog={catalog} />;
  }
  if (kind === "providers") {
    return <ProvidersPanel catalog={catalog} />;
  }
  if (kind === "setting") {
    return <SettingToggle setting={catalog.settings[entry.key]} />;
  }
  const target = LINK_PANELS[entry.panel] ?? entry.panel;
  return (
    <a
      href={target}
      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-accent"
    >
      <ArrowUpRight className="h-4 w-4" />
      Open {entry.title}
    </a>
  );
}

export default function SettingsShell({ catalog, children }: { catalog: SettingsCatalog | null; children: ReactNode }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string>("overview");
  const filtered = useSettingsSearch(catalog, query);

  const selectedEntry = useMemo(() => {
    if (!catalog) return undefined;
    for (const section of catalog.sections) {
      const entry = section.entries.find((e) => e.key === selectedKey);
      if (entry) return entry;
    }
    return undefined;
  }, [catalog, selectedKey]);

  return (
    <div className="flex h-full min-h-[calc(100vh-3.5rem)]">
      {/* Left pane — searchable catalog */}
      <aside className="w-64 shrink-0 overflow-y-auto border-r border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Settings2 className="h-4 w-4" /> Settings
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a setting… (e.g. M-Pesa)"
          className="mb-4 h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring"
        />
        {filtered.map((section) => (
          <div key={section.id} className="mb-4">
            <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            {section.entries.map((entry) => (
              <button
                key={entry.key}
                type="button"
                onClick={() => {
                  setSelectedKey(entry.key);
                  if (entry.panel === "policies/alerts") {
                    router.push("/settings/alerts");
                    return;
                  }
                }}
                className={`block w-full rounded-lg px-2 py-1.5 text-left text-xs ${
                  selectedKey === entry.key
                    ? "bg-accent font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {entry.title}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Right pane — active panel or nested route content */}
      <section className="flex-1 overflow-y-auto p-6">
        {selectedEntry ? (
          <div className="mx-auto max-w-3xl space-y-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">{selectedEntry.title}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{selectedEntry.description}</p>
            </div>
            <PanelView entry={selectedEntry} catalog={catalog ?? EMPTY_CATALOG} />
          </div>
        ) : (
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-medium">Protected mutations require step-up re-authentication</span>
            </div>
            {children}
          </div>
        )}
      </section>
    </div>
  );
}

const EMPTY_CATALOG: SettingsCatalog = {
  sections: [],
  gateways: [],
  providers: [],
  settings: {},
  generatedAtMs: 0,
};