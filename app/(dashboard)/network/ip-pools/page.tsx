import { getIpPools } from "@/actions/network";
import type { IpPoolResponse } from "@/lib/types/network";
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

  const pools = await getIpPools();

  return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            Network — IP Management
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
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
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pools.map((pool: IpPoolResponse, idx: number) => (
                  <TableRow key={`${pool.id ?? pool.name ?? "pool"}-${idx}`} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{pool.name || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{pool.network || pool.range || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{pool.gateway || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={pool.status === "active" ? "default" : "secondary"} className="text-xs">
                        {pool.status || "—"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Info Box */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-amber-900">Known Issue</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-800">
            IP pool values are currently hardcoded fixtures on the backend and do not reflect real pool state. 
            This is tracked as <code className="font-mono">BE-AAA-046</code>.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
