"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Router,
  Cpu,
  MemoryStick,
  Users,
  Clock,
  MapPin,
  Activity,
  AlertTriangle,
  WifiOff,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Cable,
  GitBranch,
} from "lucide-react";
import type { RouterDevice } from "../page";

interface Props {
  devices: RouterDevice[];
}

function StatusDot({ status }: { status: RouterDevice["status"] }) {
  const colors = {
    online:  "bg-[oklch(0.52_0.16_155)] shadow-[0_0_6px_oklch(0.52_0.16_155)]",
    warning: "bg-[oklch(0.72_0.18_65)] shadow-[0_0_6px_oklch(0.72_0.18_65)]",
    offline: "bg-[oklch(0.55_0.18_25)]",
  };
  return (
    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors[status]}`} />
  );
}

function GaugeBar({
  value,
  label,
  icon: Icon,
}: {
  value: number;
  label: string;
  icon: React.ElementType;
}) {
  const color =
    value > 80
      ? "bg-[oklch(0.55_0.18_25)]"
      : value > 60
      ? "bg-[oklch(0.72_0.18_65)]"
      : "bg-primary";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Icon className="w-3 h-3" />
          {label}
        </span>
        <span
          className={`font-semibold font-mono ${
            value > 80
              ? "text-[oklch(0.55_0.18_25)]"
              : value > 60
              ? "text-[oklch(0.65_0.18_65)]"
              : "text-foreground"
          }`}
        >
          {value}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ClientBar({
  connected,
  max,
}: {
  connected: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((connected / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Users className="w-3 h-3" />
          Clients
        </span>
        <span className="font-semibold font-mono text-foreground">
          {connected}
          <span className="font-normal text-muted-foreground">/{max}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function DeviceCard({ device }: { device: RouterDevice }) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    online:  { label: "Online",  bg: "bg-[oklch(0.97_0.03_155)]", text: "text-[oklch(0.38_0.12_155)]", border: "border-[oklch(0.88_0.06_155)]", cardBorder: "border-border" },
    warning: { label: "Warning", bg: "bg-[oklch(0.97_0.04_65)]",  text: "text-[oklch(0.5_0.18_65)]",   border: "border-[oklch(0.86_0.1_65)]",   cardBorder: "border-[oklch(0.86_0.1_65)]" },
    offline: { label: "Offline", bg: "bg-[oklch(0.97_0.02_25)]",  text: "text-[oklch(0.48_0.14_25)]",  border: "border-[oklch(0.88_0.06_25)]",  cardBorder: "border-[oklch(0.88_0.06_25)]" },
  };
  const cfg = statusConfig[device.status];

  return (
    <Card className={`border ${cfg.cardBorder} overflow-hidden transition-shadow hover:shadow-md`}>
      <CardContent className="p-0">
        {/* Card top strip */}
        <div
          className={`h-1 w-full ${
            device.status === "online"
              ? "bg-[oklch(0.52_0.16_155)]"
              : device.status === "warning"
              ? "bg-[oklch(0.72_0.18_65)]"
              : "bg-[oklch(0.55_0.18_25)]"
          }`}
        />

        <div className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Router className="w-4.5 h-4.5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground leading-tight">
                  {device.name}
                </h3>
                <p className="text-[11px] text-muted-foreground">{device.model}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <StatusDot status={device.status} />
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            {device.location} · {device.region}
          </div>

          {/* IP + uptime */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-foreground font-medium">
              {device.ipAddress}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              {device.uptime}
            </span>
          </div>

          {/* Gauges */}
          {device.status !== "offline" && (
            <div className="space-y-2 pt-1 border-t border-border">
              <GaugeBar value={device.cpuLoad} label="CPU" icon={Cpu} />
              <GaugeBar value={device.memoryUsedPct} label="RAM" icon={MemoryStick} />
              <ClientBar connected={device.connectedClients} max={device.maxClients} />
            </div>
          )}

          {device.status === "offline" && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[oklch(0.97_0.02_25)] border border-[oklch(0.88_0.06_25)] text-xs text-[oklch(0.48_0.14_25)]">
              <WifiOff className="w-3.5 h-3.5" />
              Last seen {device.lastSeen}
            </div>
          )}

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between pt-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Details</span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {expanded && (
            <div className="pt-2 border-t border-border grid grid-cols-2 gap-2 text-xs">
              {[
                { label: "Version", value: device.version, icon: Activity },
                { label: "Interfaces", value: device.interfaces, icon: Cable },
                { label: "Tunnels", value: device.activeTunnels, icon: GitBranch },
                { label: "Last Seen", value: device.lastSeen, icon: Clock },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-1.5 text-muted-foreground">
                  <Icon className="w-3 h-3 flex-shrink-0" />
                  <span className="text-foreground font-medium">{value}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function RouterDevicesView({ devices }: Props) {
  const [regionFilter, setRegionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const regions = useMemo(
    () => Array.from(new Set(devices.map((d) => d.region))),
    [devices]
  );

  const filtered = useMemo(
    () =>
      devices.filter((d) => {
        const matchRegion = regionFilter === "all" || d.region === regionFilter;
        const matchStatus = statusFilter === "all" || d.status === statusFilter;
        return matchRegion && matchStatus;
      }),
    [devices, regionFilter, statusFilter]
  );

  const online  = devices.filter((d) => d.status === "online").length;
  const warning = devices.filter((d) => d.status === "warning").length;
  const offline = devices.filter((d) => d.status === "offline").length;
  const totalClients = devices.reduce((s, d) => s + d.connectedClients, 0);

  const grouped = useMemo(() => {
    const map = new Map<string, RouterDevice[]>();
    for (const d of filtered) {
      const list = map.get(d.region) ?? [];
      list.push(d);
      map.set(d.region, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Router Devices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time health and performance of all network routers
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Summary stat strip */}
      <div className="flex items-center gap-6 px-5 py-3 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.52_0.16_155)] shadow-[0_0_6px_oklch(0.52_0.16_155)]" />
          <span className="text-sm font-semibold text-foreground">{online}</span>
          <span className="text-xs text-muted-foreground">Online</span>
        </div>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-[oklch(0.65_0.18_65)]" />
          <span className="text-sm font-semibold text-foreground">{warning}</span>
          <span className="text-xs text-muted-foreground">Warning</span>
        </div>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2">
          <WifiOff className="w-3.5 h-3.5 text-[oklch(0.55_0.18_25)]" />
          <span className="text-sm font-semibold text-foreground">{offline}</span>
          <span className="text-xs text-muted-foreground">Offline</span>
        </div>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{totalClients}</span>
          <span className="text-xs text-muted-foreground">Active Clients</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grouped cards */}
      {grouped.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-16">
          No devices match your filters.
        </p>
      ) : (
        grouped.map(([region, regionDevices]) => (
          <div key={region} className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">{region}</h2>
              <span className="text-xs text-muted-foreground">
                — {regionDevices.length} device{regionDevices.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {regionDevices.map((d) => (
                <DeviceCard key={d.id} device={d} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
