import { useCallback, useEffect, useState } from "react";

export function formatBytes(bytes: number | null | undefined): { value: string; unit: string } {
  const n = bytes ?? 0;
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let i = 0;
  let v = n;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i += 1;
  }
  return { value: i === 0 ? String(v) : v.toFixed(v >= 100 ? 0 : 1), unit: units[i] };
}

export function formatMoney(amount: number | null | undefined): string {
  return Math.round(amount ?? 0).toLocaleString("en-KE");
}

export function formatBps(bps: number | null | undefined): string {
  const n = bps ?? 0;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)} Gbps`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} Mbps`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} kbps`;
  return `${n} bps`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

/**
 * Loads when `enabled` first becomes true (a tab is opened), when `load` changes, and on `reload()`.
 * Live router reads are slow, so tabs never load before they are shown.
 */
export function useOnDemand<T>(
  load: () => Promise<{ data: T | null; error: string | null }>,
  enabled: boolean
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await load();
      setData(res.data);
      setError(res.error);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [load]);

  // a new loader (another router, another period) means the data must be read again
  useEffect(() => {
    setLoaded(false);
  }, [load]);

  useEffect(() => {
    if (enabled && !loaded && !loading) void reload();
  }, [enabled, loaded, loading, reload]);

  return { data, setData, error, loading, loaded, reload };
}
