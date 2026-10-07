import { getPermissionForRoute } from "@/lib/data/nav";
import { getRouterHistory } from "@/actions/network";
import { RouterLiveMonitor } from "./_components/RouterLiveMonitor";
import { RouterHealthHistory } from "./_components/RouterHealthHistory";
import { notFound, redirect } from "next/navigation";

interface MonitoringPageProps {
 params: Promise<{ id: string }>;
}

export const metadata = {
 title: "Router Performance Telemetry - IBS",
 description: "Live diagnostic graphs and accounting updates from RouterOS",
};

export default async function RouterMonitoringPage({ params }: MonitoringPageProps) {
  const pagePerms = await getPermissionForRoute("/network/routers");
  if (!pagePerms.canView) redirect("/dashboard");

 const routerId = Number((await params).id);
 if (isNaN(routerId)) {
 notFound();
 }

 const historicalData = await getRouterHistory(routerId, 20);

 return (
 <div className="space-y-6 p-6">
 <div className="flex flex-col gap-2">
 <h1 className="text-3xl font-normal tracking-normal">NOC Telemetry Console</h1>
 <p className="text-muted-foreground">
 Real-time interface statistics, CPU load averages, and session metrics streams over WireGuard.
 </p>
 </div>

 <RouterLiveMonitor 
 routerId={routerId} 
 initialHistory={historicalData.filter((snapshot) => snapshot.reachable !== false).reverse()}
 />

 <RouterHealthHistory routerId={routerId} />
 </div>
 );
}