import { getRouterHistory } from "@/actions/network";
import { RouterLiveMonitor } from "./_components/RouterLiveMonitor";
import { notFound } from "next/navigation";

interface MonitoringPageProps {
 params: Promise<{ id: string }>;
}

export const metadata = {
 title: "Router Performance Telemetry - IBS",
 description: "Live diagnostic graphs and accounting updates from RouterOS",
};

export default async function RouterMonitoringPage({ params }: MonitoringPageProps) {
 const routerId = Number((await params).id);
 if (isNaN(routerId)) {
 notFound();
 }

 const historicalData = await getRouterHistory(routerId, 20);

 return (
 <div className="space-y-6 p-6">
 <div className="flex flex-col gap-2">
 <h1 className="text-3xl font-bold tracking-tight">NOC Telemetry Console</h1>
 <p className="text-muted-foreground">
 Real-time interface statistics, CPU load averages, and session metrics streams over WireGuard.
 </p>
 </div>

 <RouterLiveMonitor 
 routerId={routerId} 
 initialHistory={historicalData.reverse()}
 />
 </div>
 );
}