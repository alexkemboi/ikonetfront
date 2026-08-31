import { getIpMappings } from "@/actions/network";
import type { IpMappingResponse } from "@/lib/types/api";
import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wifi } from "lucide-react";

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
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
              Network — IP Mappings
            </p>
            <h1 className="text-3xl font-serif font-semibold text-foreground">
              Active Session Bindings.
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {mappings.length} total mappings · {onlineCount} online · {expiredCount} expired
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
            <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
              Online Sessions
            </span>
            <div className="mt-2 flex items-center gap-2">
              <Wifi className="h-4 w-4 text-emerald-400" />
              <span className="text-2xl font-mono font-bold text-emerald-400">{onlineCount}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">live RADIUS sessions</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
            <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
              Expired Sessions
            </span>
            <div className="mt-2 flex items-center gap-2">
              <Wifi className="h-4 w-4 text-amber-500" />
              <span className="text-2xl font-mono font-bold text-amber-500">{expiredCount}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">no longer active</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
            <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
              Total Mappings
            </span>
            <div className="mt-2 text-2xl font-mono font-bold text-foreground">{mappings.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">observed session bindings</p>
          </div>
        </div>

        {/* Mappings Table */}
        {mappings.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-lg">
            <div className="flex flex-col items-center gap-3">
              <Wifi className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No active IP mappings at this moment.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="border-b border-border text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
                      IP Address
                    </TableHead>
                    <TableHead className="border-b border-border text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
                      MAC Address
                    </TableHead>
                    <TableHead className="border-b border-border text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
                      Username
                    </TableHead>
                    <TableHead className="border-b border-border text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
                      Service Type
                    </TableHead>
                    <TableHead className="border-b border-border text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
                      Station
                    </TableHead>
                    <TableHead className="border-b border-border text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
                      Status
                    </TableHead>
                    <TableHead className="border-b border-border text-right text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
                      Last Seen
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map((mapping: IpMappingResponse, idx: number) => (
                    <TableRow
                      key={`${mapping.ipAddress}-${mapping.macAddress}-${idx}`}
                      className="border-b border-border hover:bg-muted/40"
                    >
                      <TableCell className="font-mono text-sm font-medium">{mapping.ipAddress}</TableCell>
                      <TableCell className="font-mono text-sm">{mapping.macAddress}</TableCell>
                      <TableCell className="text-sm">{mapping.username || "—"}</TableCell>
                      <TableCell className="text-sm">
                        <Badge
                          variant="outline"
                          className="border-border bg-muted text-[10px] text-muted-foreground"
                        >
                          {mapping.serviceType || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {mapping.stationName || "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                            mapping.status === "ONLINE"
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-destructive/10 text-destructive border-destructive/20"
                          }`}
                        >
                          {mapping.status || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
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
          </div>
        )}

        {/* Info Box */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
          <p className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
            Data Source
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            IP mapping data is sourced from RADIUS accounting logs (radacct table). There may be a
            delay between an actual session event and its appearance here, depending on how
            frequently RADIUS writes accounting records to the database.
          </p>
        </div>
      </div>
    </div>
  );
}