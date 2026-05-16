// "use client";

// import { useState, useMemo } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Progress } from "@/components/ui/progress";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Router,
//   Cpu,
//   MemoryStick,
//   Users,
//   Clock,
//   MapPin,
//   Activity,
//   AlertTriangle,
//   WifiOff,
//   RefreshCw,
//   ChevronDown,
//   ChevronUp,
//   Cable,
//   GitBranch,
// } from "lucide-react";
// import type { RouterDevice } from "../page";

// interface Props {
//   devices: RouterDevice[];
// }

// function StatusDot({ status }: { status: RouterDevice["status"] }) {
//   const colors = {
//     online:  "bg-[oklch(0.52_0.16_155)] shadow-[0_0_6px_oklch(0.52_0.16_155)]",
//     warning: "bg-[oklch(0.72_0.18_65)] shadow-[0_0_6px_oklch(0.72_0.18_65)]",
//     offline: "bg-[oklch(0.55_0.18_25)]",
//   };
//   return (
//     <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors[status]}`} />
//   );
// }

// function GaugeBar({
//   value,
//   label,
//   icon: Icon,
// }: {
//   value: number;
//   label: string;
//   icon: React.ElementType;
// }) {
//   const color =
//     value > 80
//       ? "bg-[oklch(0.55_0.18_25)]"
//       : value > 60
//       ? "bg-[oklch(0.72_0.18_65)]"
//       : "bg-primary";

//   return (
//     <div className="space-y-1">
//       <div className="flex items-center justify-between text-[11px]">
//         <span className="flex items-center gap-1 text-muted-foreground">
//           <Icon className="w-3 h-3" />
//           {label}
//         </span>
//         <span
//           className={`font-semibold font-mono ${
//             value > 80
//               ? "text-[oklch(0.55_0.18_25)]"
//               : value > 60
//               ? "text-[oklch(0.65_0.18_65)]"
//               : "text-foreground"
//           }`}
//         >
//           {value}%
//         </span>
//       </div>
//       <div className="h-1.5 rounded-full bg-muted overflow-hidden">
//         <div
//           className={`h-full rounded-full transition-all ${color}`}
//           style={{ width: `${value}%` }}
//         />
//       </div>
//     </div>
//   );
// }

// function ClientBar({
//   connected,
//   max,
// }: {
//   connected: number;
//   max: number;
// }) {
//   const pct = max > 0 ? Math.round((connected / max) * 100) : 0;
//   return (
//     <div className="space-y-1">
//       <div className="flex items-center justify-between text-[11px]">
//         <span className="flex items-center gap-1 text-muted-foreground">
//           <Users className="w-3 h-3" />
//           Clients
//         </span>
//         <span className="font-semibold font-mono text-foreground">
//           {connected}
//           <span className="font-normal text-muted-foreground">/{max}</span>
//         </span>
//       </div>
//       <div className="h-1.5 rounded-full bg-muted overflow-hidden">
//         <div
//           className="h-full rounded-full bg-primary transition-all"
//           style={{ width: `${pct}%` }}
//         />
//       </div>
//     </div>
//   );
// }

// function DeviceCard({ device }: { device: RouterDevice }) {
//   const [expanded, setExpanded] = useState(false);

//   const statusConfig = {
//     online:  { label: "Online",  bg: "bg-[oklch(0.97_0.03_155)]", text: "text-[oklch(0.38_0.12_155)]", border: "border-[oklch(0.88_0.06_155)]", cardBorder: "border-border" },
//     warning: { label: "Warning", bg: "bg-[oklch(0.97_0.04_65)]",  text: "text-[oklch(0.5_0.18_65)]",   border: "border-[oklch(0.86_0.1_65)]",   cardBorder: "border-[oklch(0.86_0.1_65)]" },
//     offline: { label: "Offline", bg: "bg-[oklch(0.97_0.02_25)]",  text: "text-[oklch(0.48_0.14_25)]",  border: "border-[oklch(0.88_0.06_25)]",  cardBorder: "border-[oklch(0.88_0.06_25)]" },
//   };
//   const cfg = statusConfig[device.status];

//   return (
//     <Card className={`border ${cfg.cardBorder} overflow-hidden transition-shadow hover:shadow-md`}>
//       <CardContent className="p-0">
//         {/* Card top strip */}
//         <div
//           className={`h-1 w-full ${
//             device.status === "online"
//               ? "bg-[oklch(0.52_0.16_155)]"
//               : device.status === "warning"
//               ? "bg-[oklch(0.72_0.18_65)]"
//               : "bg-[oklch(0.55_0.18_25)]"
//           }`}
//         />

//         <div className="p-4 space-y-3">
//           {/* Header row */}
//           <div className="flex items-start justify-between gap-2">
//             <div className="flex items-center gap-2.5 min-w-0">
//               <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
//                 <Router className="w-4.5 h-4.5 text-muted-foreground" />
//               </div>
//               <div className="min-w-0">
//                 <h3 className="text-sm font-semibold text-foreground leading-tight">
//                   {device.name}
//                 </h3>
//                 <p className="text-[11px] text-muted-foreground">{device.model}</p>
//               </div>
//             </div>
//             <div className="flex items-center gap-1.5 flex-shrink-0">
//               <StatusDot status={device.status} />
//               <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
//                 {cfg.label}
//               </span>
//             </div>
//           </div>

//           {/* Location */}
//           <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
//             <MapPin className="w-3.5 h-3.5" />
//             {device.location} · {device.region}
//           </div>

//           {/* IP + uptime */}
//           <div className="flex items-center justify-between text-xs">
//             <span className="font-mono text-foreground font-medium">
//               {device.ipAddress}
//             </span>
//             <span className="flex items-center gap-1 text-muted-foreground">
//               <Clock className="w-3 h-3" />
//               {device.uptime}
//             </span>
//           </div>

//           {/* Gauges */}
//           {device.status !== "offline" && (
//             <div className="space-y-2 pt-1 border-t border-border">
//               <GaugeBar value={device.cpuLoad} label="CPU" icon={Cpu} />
//               <GaugeBar value={device.memoryUsedPct} label="RAM" icon={MemoryStick} />
//               <ClientBar connected={device.connectedClients} max={device.maxClients} />
//             </div>
//           )}

//           {device.status === "offline" && (
//             <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[oklch(0.97_0.02_25)] border border-[oklch(0.88_0.06_25)] text-xs text-[oklch(0.48_0.14_25)]">
//               <WifiOff className="w-3.5 h-3.5" />
//               Last seen {device.lastSeen}
//             </div>
//           )}

//           {/* Expand toggle */}
//           <button
//             onClick={() => setExpanded((v) => !v)}
//             className="w-full flex items-center justify-between pt-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
//           >
//             <span>Details</span>
//             {expanded ? (
//               <ChevronUp className="w-3.5 h-3.5" />
//             ) : (
//               <ChevronDown className="w-3.5 h-3.5" />
//             )}
//           </button>

//           {expanded && (
//             <div className="pt-2 border-t border-border grid grid-cols-2 gap-2 text-xs">
//               {[
//                 { label: "Version", value: device.version, icon: Activity },
//                 { label: "Interfaces", value: device.interfaces, icon: Cable },
//                 { label: "Tunnels", value: device.activeTunnels, icon: GitBranch },
//                 { label: "Last Seen", value: device.lastSeen, icon: Clock },
//               ].map(({ label, value, icon: Icon }) => (
//                 <div key={label} className="flex items-center gap-1.5 text-muted-foreground">
//                   <Icon className="w-3 h-3 flex-shrink-0" />
//                   <span className="text-foreground font-medium">{value}</span>
//                   <span>{label}</span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// export default function RouterDevicesView({ devices }: Props) {
//   const [regionFilter, setRegionFilter] = useState("all");
//   const [statusFilter, setStatusFilter] = useState("all");

//   const regions = useMemo(
//     () => Array.from(new Set(devices.map((d) => d.region))),
//     [devices]
//   );

//   const filtered = useMemo(
//     () =>
//       devices.filter((d) => {
//         const matchRegion = regionFilter === "all" || d.region === regionFilter;
//         const matchStatus = statusFilter === "all" || d.status === statusFilter;
//         return matchRegion && matchStatus;
//       }),
//     [devices, regionFilter, statusFilter]
//   );

//   const online  = devices.filter((d) => d.status === "online").length;
//   const warning = devices.filter((d) => d.status === "warning").length;
//   const offline = devices.filter((d) => d.status === "offline").length;
//   const totalClients = devices.reduce((s, d) => s + d.connectedClients, 0);

//   const grouped = useMemo(() => {
//     const map = new Map<string, RouterDevice[]>();
//     for (const d of filtered) {
//       const list = map.get(d.region) ?? [];
//       list.push(d);
//       map.set(d.region, list);
//     }
//     return Array.from(map.entries());
//   }, [filtered]);

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-start justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-foreground">Router Devices</h1>
//           <p className="text-sm text-muted-foreground mt-0.5">
//             Real-time health and performance of all network routers
//           </p>
//         </div>
//         <Button variant="outline" size="sm" className="gap-1.5">
//           <RefreshCw className="w-4 h-4" />
//           Refresh
//         </Button>
//       </div>

//       {/* Summary stat strip */}
//       <div className="flex items-center gap-6 px-5 py-3 rounded-xl border border-border bg-card">
//         <div className="flex items-center gap-2">
//           <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.52_0.16_155)] shadow-[0_0_6px_oklch(0.52_0.16_155)]" />
//           <span className="text-sm font-semibold text-foreground">{online}</span>
//           <span className="text-xs text-muted-foreground">Online</span>
//         </div>
//         <div className="w-px h-5 bg-border" />
//         <div className="flex items-center gap-2">
//           <AlertTriangle className="w-3.5 h-3.5 text-[oklch(0.65_0.18_65)]" />
//           <span className="text-sm font-semibold text-foreground">{warning}</span>
//           <span className="text-xs text-muted-foreground">Warning</span>
//         </div>
//         <div className="w-px h-5 bg-border" />
//         <div className="flex items-center gap-2">
//           <WifiOff className="w-3.5 h-3.5 text-[oklch(0.55_0.18_25)]" />
//           <span className="text-sm font-semibold text-foreground">{offline}</span>
//           <span className="text-xs text-muted-foreground">Offline</span>
//         </div>
//         <div className="w-px h-5 bg-border" />
//         <div className="flex items-center gap-2">
//           <Users className="w-3.5 h-3.5 text-muted-foreground" />
//           <span className="text-sm font-semibold text-foreground">{totalClients}</span>
//           <span className="text-xs text-muted-foreground">Active Clients</span>
//         </div>
//         <div className="ml-auto flex items-center gap-2">
//           <Select value={regionFilter} onValueChange={setRegionFilter}>
//             <SelectTrigger className="w-40 h-8 text-xs">
//               <SelectValue placeholder="All Regions" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All Regions</SelectItem>
//               {regions.map((r) => (
//                 <SelectItem key={r} value={r}>
//                   {r}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//           <Select value={statusFilter} onValueChange={setStatusFilter}>
//             <SelectTrigger className="w-32 h-8 text-xs">
//               <SelectValue placeholder="All Status" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All Status</SelectItem>
//               <SelectItem value="online">Online</SelectItem>
//               <SelectItem value="warning">Warning</SelectItem>
//               <SelectItem value="offline">Offline</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>
//       </div>

//       {/* Grouped cards */}
//       {grouped.length === 0 ? (
//         <p className="text-center text-sm text-muted-foreground py-16">
//           No devices match your filters.
//         </p>
//       ) : (
//         grouped.map(([region, regionDevices]) => (
//           <div key={region} className="space-y-3">
//             <div className="flex items-center gap-2">
//               <MapPin className="w-4 h-4 text-muted-foreground" />
//               <h2 className="text-sm font-semibold text-foreground">{region}</h2>
//               <span className="text-xs text-muted-foreground">
//                 — {regionDevices.length} device{regionDevices.length !== 1 ? "s" : ""}
//               </span>
//             </div>
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//               {regionDevices.map((d) => (
//                 <DeviceCard key={d.id} device={d} />
//               ))}
//             </div>
//           </div>
//         ))
//       )}
//     </div>
//   );
// }
"use client";

import { useMemo, useState } from "react";

import {
  AlertTriangle,
  Cpu,
  GitBranch,
  MapPin,
  MemoryStick,
  MoreHorizontal,
  RefreshCw,
  Router,
  Search,
  WifiOff,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";

import type { RouterDevice } from "../page";

interface Props {
  devices: RouterDevice[];
}

function StatusBadge({
  status,
}: {
  status: RouterDevice["status"];
}) {
  const styles = {
    online:
      "bg-emerald-50 text-emerald-700 border-emerald-200",

    warning:
      "bg-amber-50 text-amber-700 border-amber-200",

    offline:
      "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div
      className={`
        inline-flex items-center gap-2
        rounded-full border px-2.5 py-1
        text-xs font-medium capitalize
        ${styles[status]}
      `}
    >
      <span
        className={`
          h-2 w-2 rounded-full
          ${
            status === "online"
              ? "bg-emerald-500"
              : status === "warning"
              ? "bg-amber-500"
              : "bg-red-500"
          }
        `}
      />

      {status}
    </div>
  );
}

function UsageBar({
  value,
  danger = false,
}: {
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`
            h-full rounded-full transition-all
            ${
              danger
                ? value > 80
                  ? "bg-red-500"
                  : value > 60
                  ? "bg-amber-500"
                  : "bg-emerald-500"
                : "bg-primary"
            }
          `}
          style={{
            width: `${Math.min(value, 100)}%`,
          }}
        />
      </div>

      <span className="w-10 text-right text-xs font-medium">
        {value}%
      </span>
    </div>
  );
}

export default function RouterDevicesView({
  devices,
}: Props) {
  const [search, setSearch] = useState("");

  const [regionFilter, setRegionFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const regions = useMemo(() => {
    return Array.from(
      new Set(devices.map((d) => d.region))
    );
  }, [devices]);

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch =
        device.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        device.ipAddress
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        device.location
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesRegion =
        regionFilter === "all" ||
        device.region === regionFilter;

      const matchesStatus =
        statusFilter === "all" ||
        device.status === statusFilter;

      return (
        matchesSearch &&
        matchesRegion &&
        matchesStatus
      );
    });
  }, [
    devices,
    search,
    regionFilter,
    statusFilter,
  ]);

  const onlineCount = devices.filter(
    (d) => d.status === "online"
  ).length;

  const warningCount = devices.filter(
    (d) => d.status === "warning"
  ).length;

  const offlineCount = devices.filter(
    (d) => d.status === "offline"
  ).length;

  const totalClients = devices.reduce(
    (sum, device) =>
      sum + device.connectedClients,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Router Devices
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Real-time router infrastructure
            monitoring and operational
            visibility
          </p>
        </div>

        <Button
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

            <span className="text-sm font-medium text-muted-foreground">
              Online
            </span>
          </div>

          <div className="mt-3 text-3xl font-bold">
            {onlineCount}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />

            <span className="text-sm font-medium text-muted-foreground">
              Warning
            </span>
          </div>

          <div className="mt-3 text-3xl font-bold">
            {warningCount}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-red-500" />

            <span className="text-sm font-medium text-muted-foreground">
              Offline
            </span>
          </div>

          <div className="mt-3 text-3xl font-bold">
            {offlineCount}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <Router className="h-4 w-4 text-primary" />

            <span className="text-sm font-medium text-muted-foreground">
              Active Clients
            </span>
          </div>

          <div className="mt-3 text-3xl font-bold">
            {totalClients}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Search routers, IPs, locations..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="pl-10"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Select
            value={regionFilter}
            onValueChange={setRegionFilter}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Region" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                All Regions
              </SelectItem>

              {regions.map((region) => (
                <SelectItem
                  key={region}
                  value={region}
                >
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                All Status
              </SelectItem>

              <SelectItem value="online">
                Online
              </SelectItem>

              <SelectItem value="warning">
                Warning
              </SelectItem>

              <SelectItem value="offline">
                Offline
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>
                  Router
                </TableHead>

                <TableHead>
                  Status
                </TableHead>

                <TableHead>
                  Region
                </TableHead>

                <TableHead>
                  IP Address
                </TableHead>

                <TableHead>
                  CPU
                </TableHead>

                <TableHead>
                  Memory
                </TableHead>

                <TableHead>
                  Clients
                </TableHead>

                <TableHead>
                  Tunnels
                </TableHead>

                <TableHead>
                  Uptime
                </TableHead>

                <TableHead>
                  Version
                </TableHead>

                <TableHead className="w-[70px] text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredDevices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No routers found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDevices.map(
                  (device) => (
                    <TableRow
                      key={device.id}
                      className="hover:bg-muted/30"
                    >
                      {/* Router */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                            <Router className="h-5 w-5 text-muted-foreground" />
                          </div>

                          <div className="min-w-0">
                            <div className="font-semibold">
                              {device.name}
                            </div>

                            <div className="truncate text-xs text-muted-foreground">
                              {device.model}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <StatusBadge
                          status={
                            device.status
                          }
                        />
                      </TableCell>

                      {/* Region */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />

                          <span className="text-sm">
                            {device.region}
                          </span>
                        </div>
                      </TableCell>

                      {/* IP */}
                      <TableCell>
                        <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                          {
                            device.ipAddress
                          }
                        </span>
                      </TableCell>

                      {/* CPU */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Cpu className="h-3 w-3" />
                            CPU
                          </div>

                          <UsageBar
                            value={
                              device.cpuLoad
                            }
                            danger
                          />
                        </div>
                      </TableCell>

                      {/* RAM */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MemoryStick className="h-3 w-3" />
                            RAM
                          </div>

                          <UsageBar
                            value={
                              device.memoryUsedPct
                            }
                            danger
                          />
                        </div>
                      </TableCell>

                      {/* Clients */}
                      <TableCell>
                        <div>
                          <div className="font-semibold">
                            {
                              device.connectedClients
                            }
                          </div>

                          <div className="text-xs text-muted-foreground">
                            /
                            {
                              device.maxClients
                            }{" "}
                            max
                          </div>
                        </div>
                      </TableCell>

                      {/* Tunnels */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-muted-foreground" />

                          <span className="font-medium">
                            {
                              device.activeTunnels
                            }
                          </span>
                        </div>
                      </TableCell>

                      {/* Uptime */}
                      <TableCell>
                        <span className="text-sm">
                          {device.uptime}
                        </span>
                      </TableCell>

                      {/* Version */}
                      <TableCell>
                        <span className="rounded-md border bg-muted/40 px-2 py-1 text-xs font-medium">
                          {
                            device.version
                          }
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              View Details
                            </DropdownMenuItem>

                            <DropdownMenuItem>
                              Restart Router
                            </DropdownMenuItem>

                            <DropdownMenuItem>
                              Open Winbox
                            </DropdownMenuItem>

                            <DropdownMenuItem>
                              View Logs
                            </DropdownMenuItem>

                            <DropdownMenuItem className="text-red-600">
                              Disable Device
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                )
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}