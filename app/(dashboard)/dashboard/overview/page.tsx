import { getDashboardOverview } from "@/actions/dashboard";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShiftGreetingBanner } from "@/components/dashboard/ShiftGreetingBanner";
import { LiveTransactionTicker } from "@/components/dashboard/LiveTransactionTicker";
import { OverviewKpiCards } from "@/components/dashboard/OverviewKpiCards";
import { RenewalsDueCard } from "@/components/dashboard/RenewalsDueCard";
import { RouterTrafficCard } from "@/components/dashboard/RouterTrafficCard";
import { WhatsNextActionQueue } from "@/components/dashboard/WhatsNextActionQueue";
import { NetworkPulseHeatmap } from "@/components/dashboard/NetworkPulseHeatmap";
import { LiveDataRefresh } from "@/providers/MonitoringHeartbeat";
import { getCompanyFeeStatus } from "@/actions/platformFees";
import { systemFeeNextItem } from "@/components/dashboard/systemFeeNextItem";
import { getAccess } from "@/lib/data/access";
import { can } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function OverviewDashboardPage() {
  // the page reads the operations cockpit: shown to roles that may read it
  const isOperator = can(await getAccess(), "API_OPERATIONSCOCKPIT", "VIEW");

  if (!isOperator) redirect("/dashboard");

 const [data, feeStatus] = await Promise.all([getDashboardOverview(), getCompanyFeeStatus()]);

 if (!data.success) {
  return <div className="min-h-screen p-4 sm:p-6 lg:p-8"><div role="alert" className="mx-auto max-w-7xl rounded-lg border border-destructive/30 bg-destructive/5 p-5"><h1 className="text-lg font-medium">Dashboard unavailable</h1><p className="mt-1 text-sm text-muted-foreground">{data.message}{data.requestId ? ` · Ref: ${data.requestId}` : ""}</p></div></div>;
 }
 const overview = data.data;
 // system fees owed come first: unpaid past the suspension day, sales stop
 const feeItem = systemFeeNextItem(feeStatus);
 const whatsNext = feeItem ? [feeItem, ...overview.whatsNextQueue] : overview.whatsNextQueue;
 const online = overview.onlineHotspotCount != null && overview.onlinePppoeCount != null
  ? { total: overview.onlineSubscribersCount, hotspot: overview.onlineHotspotCount, pppoe: overview.onlinePppoeCount }
  : null;
 const customers = overview.customersPppoeCount != null && overview.customersHotspotCount != null && overview.customersTvCount != null
  ? { pppoe: overview.customersPppoeCount, hotspot: overview.customersHotspotCount, tv: overview.customersTvCount }
  : null;

  return (
 <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
 <LiveDataRefresh />
 <div className="mx-auto max-w-7xl space-y-6">
 {/* 1. Shift Greeting & Header Context */}
 <ShiftGreetingBanner
 tenantName={overview.companyName}
 onlineCount={overview.onlineSubscribersCount}
 shiftName={overview.shiftName}
 expiriesCount={overview.expiriesDue24hCount}
 smsCreditLow={overview.smsCreditLow}
 lastHourTrafficGb={overview.lastHourTrafficGb}
 />

 {/* 2. Live M-Pesa Ticker & Router Health */}
        <LiveTransactionTicker ticker={overview.liveTicker} routerTraffic={overview.routerTraffic} />

 {/* 3. Primary KPI Metric Cards */}
 <OverviewKpiCards
 paymentsTodayCount={overview.todayEventsCount}
 activePppoeSubscriptions={overview.activeSubscriptionsCount}
 onlineCount={overview.onlineSubscribersCount}
 online={online}
 accessPointsSeen={overview.accessPointsSeenCount ?? null}
 accessPointsNotSeen={overview.accessPointsNotSeenCount ?? null}
 routers={overview.mikrotikTotalCount ?? null}
 companies={overview.companiesCount != null && overview.companiesActiveCount != null
  ? { total: overview.companiesCount, active: overview.companiesActiveCount }
  : null}
 customers={customers}
 />

 {/* 4. Two-Column Operational Split */}
 <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
 <RenewalsDueCard items={overview.renewalsDue} />
 <RouterTrafficCard items={overview.routerTraffic} />
 </div>

 {/* 5. What's Next Action Queue */}
 <WhatsNextActionQueue items={whatsNext} />

 {/* 6. 7x24 Traffic Heatmap */}
 <NetworkPulseHeatmap heatmap={overview.heatmap} />
 </div>
 </div>
 );
}