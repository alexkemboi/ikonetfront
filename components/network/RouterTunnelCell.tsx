"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, Lock, LockOpen } from "lucide-react";
import { toast } from "sonner";
import { allocateTunnel, deallocateTunnel } from "@/actions/network";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TunnelCellProps {
  deviceId?: number;
  /** Full "publicIp:port" — presence plus a non-expired lease = enabled. */
  winboxTunnelAddress?: string | null;
  winboxTunnelPort?: number | null;
  webConsoleUrl?: string | null;
  tunnelExpiresAt?: string | null;
  canEdit?: boolean;
}

function isLeaseActive(tunnelExpiresAt?: string | null): boolean {
  if (!tunnelExpiresAt) return false;
  const expires = new Date(tunnelExpiresAt).getTime();
  if (!Number.isFinite(expires)) return true;
  return Date.now() < expires;
}

/** Track 1 — WinBox relay lease + WebFig console controls for one NAS row. */
export function RouterTunnelCell({
  deviceId,
  winboxTunnelAddress,
  winboxTunnelPort,
  webConsoleUrl,
  tunnelExpiresAt,
  canEdit,
}: TunnelCellProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<"enable" | "disable" | null>(null);

  const numericDevice = Number(deviceId);
  const hasNumericDevice = Number.isFinite(numericDevice) && numericDevice > 0;
  const leaseActive = isLeaseActive(tunnelExpiresAt);
  const enabled = !!winboxTunnelAddress && leaseActive;
  const hasConsole = !!webConsoleUrl;

  const copyHostPort = async () => {
    if (!winboxTunnelAddress) return;
    try {
      await navigator.clipboard.writeText(winboxTunnelAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Clipboard unavailable — copy the address manually.");
    }
  };

  const run = async (kind: "enable" | "disable") => {
    if (!hasNumericDevice) return;
    setBusy(kind);
    const res =
      kind === "enable"
        ? await allocateTunnel(numericDevice)
        : await deallocateTunnel(numericDevice);
    setBusy(null);
    if (res.success) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  };

  // ── WinBox Tunnel column ──
  const winboxCell = enabled ? (
    <div className="flex items-center gap-1.5" data-testid="winbox-tunnel-cell">
      <Badge variant="outline" className="font-sans tabular-nums">
        :{winboxTunnelPort ?? winboxTunnelAddress?.split(":")[1] ?? "—"}
      </Badge>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={copyHostPort}
        aria-label="Copy WinBox host:port"
        title={winboxTunnelAddress}
      >
        {copied ? <Check className="text-emerald-400" /> : <Copy />}
      </Button>
      {canEdit && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => run("disable")}
          disabled={busy === "disable"}
          aria-label="Deallocate WinBox tunnel"
          title="Deallocate tunnel"
        >
          <LockOpen />
        </Button>
      )}
    </div>
  ) : hasNumericDevice && canEdit ? (
    <Button
      variant="outline"
      size="xs"
      onClick={() => run("enable")}
      disabled={busy === "enable"}
      data-testid="enable-winbox-tunnel"
    >
      Enable WinBox
    </Button>
  ) : (
    <span className="text-[11px] text-muted-foreground">—</span>
  );

  // ── Web Console column ──
  let consoleCell: ReactNode;
  if (hasConsole && leaseActive) {
    consoleCell = (
      <a
        href={webConsoleUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-amber-500 hover:text-amber-400"
        data-testid="web-console-link"
      >
        Open WebConsole <ExternalLink className="h-3 w-3" />
      </a>
    );
  } else if (hasConsole && hasNumericDevice && canEdit) {
    // Lease expired — the URL is stale; re-enable starts a fresh lease.
    consoleCell = (
      <Button
        variant="ghost"
        size="xs"
        onClick={() => run("enable")}
        disabled={busy === "enable"}
        className="text-amber-500 hover:text-amber-400"
      >
        Re-enable
      </Button>
    );
  } else if (hasNumericDevice && canEdit && !hasConsole && !enabled) {
    consoleCell = (
      <Button
        variant="ghost"
        size="xs"
        onClick={() => run("enable")}
        disabled={busy === "enable"}
        className="text-muted-foreground"
      >
        <Lock className="h-3 w-3" /> Enable WinBox
      </Button>
    );
  } else {
    consoleCell = <span className="text-[11px] text-muted-foreground">—</span>;
  }

  return (
    <div className="flex items-center gap-4">
      {winboxCell}
      {consoleCell}
    </div>
  );
}