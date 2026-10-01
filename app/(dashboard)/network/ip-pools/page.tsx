import { getIpPoolsResult } from "@/actions/network";
import type { IpPool } from "@/lib/types/api";
import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Layers } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "IP Pools — IBS" };

const probeErrorMessages: Record<NonNullable<IpPool["probeError"]>, string> = {
  ROUTER_UNREACHABLE: "Router not reachable; showing the last known value.",
  ROUTER_AUTH_FAILED: "Router authentication failed; showing the last known value.",
  PROBE_FAILED: "The router probe failed; showing the last known value.",
  USAGE_QUERY_FAILED: "Usage could not be queried; showing the last known value.",
  POOL_NOT_LINKED: "This pool is not linked to a router.",
  NO_NAS_SCOPE: "No NAS scope is available for this pool.",
  INVALID_SUBNET: "The pool subnet is invalid, so utilization could not be calculated.",
};

function usageDescription(source: IpPool["usageSource"]): string {
  if (source === "MIKROTIK_DHCP_LEASES") {
    return "Used counts bound, enabled DHCP leases; expired, waiting, offered, and disabled leases are excluded.";
  }
  if (source === "RADIUS_ACTIVE_SESSIONS") {
    return "Used counts distinct IPs from live RADIUS sessions updated in the last 60 minutes.";
  }
  return "Used counts enabled WireGuard peers with addresses inside this subnet.";
}

function sampledAgo(timestamp: string | null): string {
  if (!timestamp) return "sample time unavailable";
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000));
  if (!Number.isFinite(elapsedSeconds)) return "sample time unavailable";
  if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;
  return `${Math.floor(elapsedSeconds / 86400)}d ago`;
}

export default async function IpPoolsPage() {
  const pagePerms = await getPermissionForRoute("/network/ip-pools");
  if (!pagePerms.canView) redirect("/dashboard");

  const result = await getIpPoolsResult();
  if (!result.success) {
    return <div className="min-h-screen p-4 sm:p-6 lg:p-8"><div role="alert" className="mx-auto max-w-7xl rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm"><h1 className="font-medium">IP pool data unavailable</h1><p className="mt-1 text-muted-foreground">{result.message}{result.requestId ? ` · Ref: ${result.requestId}` : ""}</p></div></div>;
  }
  const pools = result.pools;

  return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <p className="text-[11px] font-sans tabular-nums uppercase tracking-widest text-muted-foreground">
            Network — IP Management
          </p>
          <h1 className="mt-1 text-3xl font-normal tracking-normal text-foreground">
            IP Address Pools
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pools.length} address pool{pools.length !== 1 ? "s" : ""} configured for DHCP and static allocation.
          </p>
        </div>

        {/* Pools Grid */}
        {pools.length === 0 ? (
          <Card className="border">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <Layers className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No IP pools configured yet.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Pool Name</TableHead>
                  <TableHead className="font-semibold">Network Range</TableHead>
                  <TableHead className="font-semibold">Gateway</TableHead>
                  <TableHead className="font-semibold">Usage / Probe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pools.map((pool: IpPool, idx: number) => (
                  <TableRow key={pool.poolId ?? `${pool.poolName}-${idx}`} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{pool.poolName || "—"}</TableCell>
                    <TableCell className="font-sans tabular-nums text-sm">{pool.subnet || "—"}</TableCell>
                    <TableCell className="font-sans tabular-nums text-sm">{pool.gateway ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="default" title={usageDescription(pool.usageSource)} className="text-xs">{pool.usedIps}/{pool.totalIps} used · {pool.utilizationPercentage}%</Badge>
                        <Badge variant={pool.probeStatus === "OK" ? "outline" : "destructive"} className="text-xs">{pool.probeStatus}</Badge>
                        {pool.stale && <Badge variant="outline" title={pool.lastProbedAt ?? "No successful sample time recorded"} className="text-xs">Stale · last sampled {sampledAgo(pool.lastProbedAt)}</Badge>}
                        {pool.overCapacity && <Badge variant="destructive" className="text-xs">Over capacity · {pool.rawUsedIps} in use</Badge>}
                      </div>
                      {pool.probeError && <p className="mt-1 text-xs text-destructive">{probeErrorMessages[pool.probeError]}</p>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
