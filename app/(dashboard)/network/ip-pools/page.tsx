import { getIpPoolsResult } from "@/actions/network";
import type { IpPool } from "@/lib/types/api";
import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
                        <Badge variant="default" className="text-xs">{pool.usedIps}/{pool.totalIps} used · {pool.utilizationPercentage}%</Badge>
                        <Badge variant={pool.probeStatus === "OK" ? "outline" : "destructive"} className="text-xs">{pool.probeStatus}</Badge>
                        {pool.stale && <Badge variant="outline" className="text-xs">Stale{pool.lastProbedAt ? ` · ${pool.lastProbedAt}` : ""}</Badge>}
                        {pool.overCapacity && <Badge variant="destructive" className="text-xs">Over capacity · {pool.rawUsedIps} in use</Badge>}
                      </div>
                      {pool.probeError && <p className="mt-1 text-xs text-destructive">{pool.probeError.replaceAll("_", " ")}</p>}
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
