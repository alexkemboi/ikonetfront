"use client";

import { useEffect, useState, startTransition } from "react";
import { RouterCapacityResponse } from "@/lib/types/network";
import { getStationLoad } from "@/actions/network";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, ServerCrash, Cpu, UserCheck } from "lucide-react";

interface StationCapacityIndicatorProps {
 stationId: number | null;
}

export function StationCapacityIndicator({ stationId }: StationCapacityIndicatorProps) {
 const [loading, setLoading] = useState<boolean>(false);
 const [routers, setRouters] = useState<RouterCapacityResponse[]>([]);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 if (!stationId) {
 setRouters([]);
 return;
 }

 const fetchLoadData = async () => {
 setLoading(true);
 setError(null);
 try {
 const data = await getStationLoad(stationId);
 startTransition(() => {
 setRouters(data);
 });
} catch {
  setError("Failed to query hardware load indexes from this station.");
 } finally {
 setLoading(false);
 }
 };

 fetchLoadData();
 }, [stationId]);

 if (!stationId) {
 return (
 <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
 Select a Point of Presence (POP) Station above to evaluate physical capacity.
 </div>
 );
 }

 if (loading) {
 return (
 <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
 <Loader2 className="h-4 w-4 animate-spin text-primary" />
 <span>Evaluating hardware capacity scores...</span>
 </div>
 );
 }

 if (error) {
 return (
 <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 flex items-center gap-3 text-sm text-destructive">
 <ServerCrash className="h-5 w-5" />
 <span>{error}</span>
 </div>
 );
 }

 if (routers.length === 0) {
 return (
 <div className="rounded-lg border bg-muted/20 p-4 text-center text-sm text-muted-foreground italic">
 No active online routers are configured at this POP Station.
 </div>
 );
 }

 return (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">POP Router Capacity Profiles</h4>
 <span className="text-[10px] text-muted-foreground font-mono">Dynamic Weighted Load-Balancing</span>
 </div>

 <div className="space-y-3">
 {routers.map((router) => {
 let progressColor = "bg-green-500";
 let badgeVariant: "default" | "secondary" | "destructive" = "default";

 if (router.healthStatus === "CRITICAL") {
 progressColor = "bg-red-500 animate-pulse";
 badgeVariant = "destructive";
 } else if (router.healthStatus === "WARNING") {
 progressColor = "bg-yellow-500";
 badgeVariant = "secondary";
 }

 return (
 <div key={router.id} className="p-3 rounded-lg border border-border bg-card shadow-sm space-y-2">
 <div className="flex items-center justify-between text-sm">
 <div className="flex flex-col">
 <span className="font-semibold text-card-foreground">{router.name}</span>
 <span className="text-[11px] text-muted-foreground font-mono">{router.ipAddress}</span>
 </div>
 <Badge variant={badgeVariant} className="text-[10px] font-semibold py-0.5">
 {router.healthStatus} (Score: {router.loadFactor})
 </Badge>
 </div>

 <div className="space-y-1">
 <Progress value={router.loadFactor} className={`h-2 rounded-full ${progressColor}`} />
 <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
 <span className="flex items-center gap-1"><UserCheck className="h-3 w-3" /> {router.currentSessions} / {router.maxSessions} Subs</span>
 <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> {router.cpuUsage}% CPU</span>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
}