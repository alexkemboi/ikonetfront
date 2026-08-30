"use client";

import { useEffect, useState } from "react";
import { RouterHealthSnapshot } from "@/lib/types/network";
import { getRouterMonitoringLatest } from "@/actions/network";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
 LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { Cpu, Database, Activity, Wifi, Heart, Clock } from "lucide-react";

interface RouterLiveMonitorProps {
 routerId: number;
 initialHistory: RouterHealthSnapshot[];
}

const POLL_INTERVAL_MS = 5000;
const STREAM_RECONNECT_MS = 30000;
const STREAM_CONNECT_TIMEOUT_MS = 10000;
const STREAM_STALL_MS = 45000;
const WINDOW_SIZE = 20;

export function RouterLiveMonitor({ routerId, initialHistory }: RouterLiveMonitorProps) {
 const [dataStream, setDataStream] = useState<RouterHealthSnapshot[]>(initialHistory);
 const [isOnline, setIsOnline] = useState<boolean>(true);
 const [streamMode, setStreamMode] = useState<"streaming" | "polling">("streaming");
 const [latest, setLatest] = useState<RouterHealthSnapshot | null>(initialHistory[initialHistory.length - 1] || null);

 // Prefer the SSE live stream (relayed by /api/monitoring/router/[id]/live).
 // If the EventSource drops — backend down, relay returning an error envelope —
 // degrade to the historical 5s `/latest` polling so the page never goes dark.
 // While polling, periodically re-probe the stream and switch back once frames
 // flow again.
 useEffect(() => {
 let cancelled = false;
 let source: EventSource | null = null;
 let pollTimer: ReturnType<typeof setInterval> | null = null;
 let reconnectTimer: ReturnType<typeof setInterval> | null = null;
 let connectTimer: ReturnType<typeof setTimeout> | null = null;
 let stallTimer: ReturnType<typeof setTimeout> | null = null;
 let inFlight = false;

 const append = (snap: RouterHealthSnapshot) => {
 if (cancelled) return;
 setLatest(snap);
 setIsOnline(true);
 setDataStream((prev) => {
 if (prev.some((s) => s.idxno === snap.idxno)) return prev;
 return [...prev, snap].slice(-WINDOW_SIZE);
 });
 };

 const tick = async () => {
 if (cancelled || inFlight) return;
 inFlight = true;
 try {
 const latestSnap = await getRouterMonitoringLatest(routerId);
 if (cancelled) return;
 setIsOnline(!!latestSnap);
 if (latestSnap) append(latestSnap);
 } catch {
 if (!cancelled) setIsOnline(false);
 } finally {
 inFlight = false;
 }
 };

 const stopTimers = () => {
 if (pollTimer) {
 clearInterval(pollTimer);
 pollTimer = null;
 }
 if (reconnectTimer) {
 clearInterval(reconnectTimer);
 reconnectTimer = null;
 }
 if (connectTimer) {
 clearTimeout(connectTimer);
 connectTimer = null;
 }
 if (stallTimer) {
 clearTimeout(stallTimer);
 stallTimer = null;
 }
 };

 const degradeToPolling = () => {
 source?.close();
 source = null;
 if (connectTimer) {
 clearTimeout(connectTimer);
 connectTimer = null;
 }
 if (stallTimer) {
 clearTimeout(stallTimer);
 stallTimer = null;
 }
 setIsOnline(false);
 startPolling();
 };

 const startPolling = () => {
 setStreamMode("polling");
 if (pollTimer) return;
 tick();
 pollTimer = setInterval(tick, POLL_INTERVAL_MS);
 reconnectTimer = setInterval(() => {
 if (!cancelled) startStreaming();
 }, STREAM_RECONNECT_MS);
 };

 const startStreaming = () => {
 setStreamMode("streaming");
 stopTimers();
 source = new EventSource(`/api/monitoring/router/${routerId}/live`);

 const armStallWatchdog = () => {
 if (stallTimer) clearTimeout(stallTimer);
 stallTimer = setTimeout(() => {
 if (!cancelled) degradeToPolling();
 }, STREAM_STALL_MS);
 };

 connectTimer = setTimeout(() => {
 if (source && source.readyState === EventSource.CONNECTING) {
 degradeToPolling();
 }
 }, STREAM_CONNECT_TIMEOUT_MS);

 source.addEventListener("telemetry", (event) => {
 try {
 const snap = JSON.parse((event as MessageEvent).data as string) as RouterHealthSnapshot;
 append(snap);
 armStallWatchdog();
 } catch {
 // Malformed frame — ignore, the heartbeat keeps the stream alive.
 }
 });
 source.onopen = () => {
 if (cancelled) return;
 if (connectTimer) {
 clearTimeout(connectTimer);
 connectTimer = null;
 }
 setIsOnline(true);
 armStallWatchdog();
 };
 source.onerror = () => {
 degradeToPolling();
 };
 };

 startStreaming();

 return () => {
 cancelled = true;
 source?.close();
 stopTimers();
 };
 }, [routerId]);

 const formatRAM = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const formatTime = (timeStr: unknown): string => {
    try {
      const date = new Date(String(timeStr));
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <Heart className={`h-5 w-5 animate-pulse ${isOnline ? "text-red-500" : "text-muted-foreground"}`} />
          <span className="font-semibold text-sm">Monitoring Status</span>
        </div>
        <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
          {streamMode === "streaming"
            ? isOnline
              ? "STREAMING · LIVE"
              : "STREAMING · RECONNECTING"
            : isOnline
              ? "POLLING · LIVE DATA"
              : "POLLING · OFFLINE"}
        </Badge>
      </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <Card className="border shadow-sm">
 <CardContent className="p-6 flex items-center gap-4">
 <div className="p-3 bg-red-500/10 rounded-lg text-red-500"><Cpu className="h-6 w-6" /></div>
 <div>
 <p className="text-xs text-muted-foreground font-medium">CPU Resource Load</p>
 <h3 className="text-2xl font-bold font-mono">{latest ? `${latest.cpuUsage}%` : "0%"}</h3>
 </div>
 </CardContent>
 </Card>

 <Card className="border shadow-sm">
 <CardContent className="p-6 flex items-center gap-4">
 <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><Database className="h-6 w-6" /></div>
 <div>
 <p className="text-xs text-muted-foreground font-medium">Available Memory</p>
 <h3 className="text-2xl font-bold font-mono">{latest ? formatRAM(latest.freeMemory) : "0 MB"}</h3>
 </div>
 </CardContent>
 </Card>

 <Card className="border shadow-sm">
 <CardContent className="p-6 flex items-center gap-4">
 <div className="p-3 bg-green-500/10 rounded-lg text-green-500"><Wifi className="h-6 w-6" /></div>
 <div>
 <p className="text-xs text-muted-foreground font-medium">Active PPPoE Sessions</p>
 <h3 className="text-2xl font-bold font-mono">{latest ? latest.activePppoeSessions : "0"}</h3>
 </div>
 </CardContent>
 </Card>

 <Card className="border shadow-sm">
 <CardContent className="p-6 flex items-center gap-4">
 <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-500"><Clock className="h-6 w-6" /></div>
 <div>
 <p className="text-xs text-muted-foreground font-medium">Hardware Uptime</p>
 <h3 className="text-lg font-bold font-mono truncate">{latest ? latest.uptime : "00:00:00"}</h3>
 </div>
 </CardContent>
 </Card>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 
 <Card className="border shadow-sm">
 <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> CPU & WireGuard Latency Trend</CardTitle></CardHeader>
 <CardContent className="h-80">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={dataStream} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="#333/10" />
 <XAxis dataKey="createdAt" tickFormatter={formatTime} className="text-xs font-mono" />
 <YAxis yAxisId="left" className="text-xs" />
 <YAxis yAxisId="right" orientation="right" className="text-xs" unit="ms" />
 <Tooltip labelFormatter={formatTime} />
 <Legend />
 <Line yAxisId="left" type="monotone" dataKey="cpuUsage" name="CPU (%)" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
 <Line yAxisId="right" type="monotone" dataKey="latencyMs" name="Latency (ms)" stroke="#3b82f6" strokeWidth={2} dot={false} />
 </LineChart>
 </ResponsiveContainer>
 </CardContent>
 </Card>

 <Card className="border shadow-sm">
 <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wifi className="h-4 w-4 text-primary" /> Active Online Session Profiles</CardTitle></CardHeader>
 <CardContent className="h-80">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={dataStream} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="#333/10" />
 <XAxis dataKey="createdAt" tickFormatter={formatTime} className="text-xs font-mono" />
 <YAxis className="text-xs" allowDecimals={false} />
 <Tooltip labelFormatter={formatTime} />
 <Legend />
 <Line type="monotone" dataKey="activePppoeSessions" name="Active PPPoE" stroke="#10b981" strokeWidth={2} dot={false} />
 <Line type="monotone" dataKey="activeHotspotSessions" name="Active Hotspot" stroke="#f59e0b" strokeWidth={2} dot={false} />
 </LineChart>
 </ResponsiveContainer>
 </CardContent>
 </Card>

 </div>
 </div>
 );
}