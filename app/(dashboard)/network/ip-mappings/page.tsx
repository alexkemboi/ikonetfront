import { getIpMappings } from "@/actions/network";
import type { IpMappingResponse } from "@/lib/types/api";
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
import { Wifi, Search } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "IP Mappings — IBS" };

export default async function IpMappingsPage() {
  const pagePerms = await getPermissionForRoute("/network/ip-mappings");
  if (!pagePerms.canView) redirect("/dashboard");

  const mappings = await getIpMappings();

  const onlineCount = mappings.filter((mapping: IpMappingResponse) => mapping.status === "ONLINE").length;
  const expiredCount = mappings.filter((mapping: IpMappingResponse) => mapping.status === "EXPIRED").length;

  return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            Network — IP Mappings
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Active Session Bindings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mappings.length} total mappings · {onlineCount} online · {expiredCount} expired
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg text-green-600">
                  <Wifi className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Online Sessions</p>
                  <h3 className="text-2xl font-bold">{onlineCount}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-lg text-amber-600">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Expired Sessions</p>
                  <h3 className="text-2xl font-bold">{expiredCount}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-600">
                  <Wifi className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Mappings</p>
                  <h3 className="text-2xl font-bold">{mappings.length}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mappings Table */}
        {mappings.length === 0 ? (
          <Card className="border">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <Wifi className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No active IP mappings at this moment.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">IP Address</TableHead>
                  <TableHead className="font-semibold">MAC Address</TableHead>
                  <TableHead className="font-semibold">Username</TableHead>
                  <TableHead className="font-semibold">Service Type</TableHead>
                  <TableHead className="font-semibold">Station</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping: IpMappingResponse, idx: number) => (
                  <TableRow key={`${mapping.ipAddress}-${mapping.macAddress}-${idx}`} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm font-medium">{mapping.ipAddress}</TableCell>
                    <TableCell className="font-mono text-sm">{mapping.macAddress}</TableCell>
                    <TableCell className="text-sm">{mapping.username || "—"}</TableCell>
                    <TableCell className="text-sm">
                      <Badge variant="outline" className="text-xs">
                        {mapping.serviceType || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{mapping.stationName || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={mapping.status === "ONLINE" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {mapping.status || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground text-right">
                      {mapping.lastSeen
                        ? new Date(mapping.lastSeen).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Info Box */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-blue-900">Data Source</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800">
            IP mapping data is sourced from RADIUS accounting logs (radacct table). There may be a delay 
            between an actual session event and its appearance here, depending on how frequently RADIUS writes 
            accounting records to the database.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
