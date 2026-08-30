"use client";

import { useEffect, useState } from "react";
import { getLatestRouterHealth } from "@/actions/network";
import { RouterHealthSnapshot } from "@/lib/types/network";
import {
  getRouterMonitoringLatest,
  getRouterMonitoringHistory,
} from "@/actions/network";
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

export function RouterLiveMonitor({ routerId, initialHistory }: RouterLiveMonitorProps) {
 const [dataStream, setDataStream] = useState<RouterHealthSnapshot[]>(initialHistory);
 const [isOnline, setIsOnline] = useState<boolean>(true);
 const [latest, setLatest] = useState<RouterHealthSnapshot | null>(initialHistory[initialHistory.length - 1] || null);
 const [isPolling, setIsPolling] = useState<boolean>(false);

  // BE-AAA-045 (SSE live endpoint) is not deployed yet, so we prime the window
  // from `/history` once, then poll only `/latest` — with an in-flight guard so
  // slow ticks can never stack overlapping requests on a 5s interval.
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    // Prime the rolling window once from history.
    getRouterMonitoringHistory(routerId, 20)
      .then((history) => {
        if (!cancelled && history.length > 0) setDataStream(history);
      })
      .catch(() => undefined);

    const tick = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      try {
        const latestSnap = await getRouterMonitoringLatest(routerId);
        if (cancelled) return;

        setIsOnline(!!latestSnap);
        if (!latestSnap) return;
        setLatest(latestSnap);
        setDataStream((prev) => {
          if (prev.some((s) => s.idxno === latestSnap.idxno)) return prev;
          return [...prev, latestSnap].slice(-20);
        });
      } catch {
        if (!cancelled) setIsOnline(false);
      } finally {
        inFlight = false;
      }
    };

    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
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
          {isOnline ? "POLLING · LIVE DATA" : "POLLING · OFFLINE"}
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