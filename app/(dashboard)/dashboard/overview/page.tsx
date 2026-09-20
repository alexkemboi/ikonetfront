import { getDashboardOverview } from "@/actions/dashboard";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROLE_NAME, normalizeRole } from "@/lib/types/roles";
import { ShiftGreetingBanner } from "@/components/dashboard/ShiftGreetingBanner";
import { LiveTransactionTicker } from "@/components/dashboard/LiveTransactionTicker";
import { OverviewKpiCards } from "@/components/dashboard/OverviewKpiCards";
import { RenewalsDueCard } from "@/components/dashboard/RenewalsDueCard";
import { RouterTrafficCard } from "@/components/dashboard/RouterTrafficCard";
import { WhatsNextActionQueue } from "@/components/dashboard/WhatsNextActionQueue";
import { TodayActivityFeed } from "@/components/dashboard/TodayActivityFeed";
import { NetworkPulseHeatmap } from "@/components/dashboard/NetworkPulseHeatmap";

export const dynamic = "force-dynamic";

export default async function OverviewDashboardPage() {
  const session = await auth();
  const role = normalizeRole(session?.user?.role);
  const rawRole = session?.user?.role ?? "";

  const isOperator = role === ROLE_NAME.ADMIN ||
                     role === ROLE_NAME.MANAGEMENT ||
                     role === ROLE_NAME.STAFF ||
                     /^(SYSADMIN|ROLE_SYSADMIN|SUPER_ADMIN|01|02|03)$/i.test(rawRole.trim());

  if (!isOperator) redirect("/dashboard");

 const data = await getDashboardOverview();

 return (
 <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
 <div className="mx-auto max-w-7xl space-y-6">
 {/* 1. Shift Greeting & Header Context */}
 <ShiftGreetingBanner
 tenantName={data.tenantName}
 onlineCount={data.onlineSubscribersCount}
 shiftName={data.shiftName}
 expiriesCount={data.expiriesDue24hCount}
 smsCreditLow={data.smsCreditLow}
 lastHourTrafficGb={data.lastHourTrafficGb}
 />

 {/* 2. Live M-Pesa Ticker & Router Health */}
 <LiveTransactionTicker ticker={data.liveTicker} />

 {/* 3. Primary KPI Metric Cards */}
 <OverviewKpiCards
 revenueToday={data.revenueToday}
 revenueChangePercent={data.revenueTodayChangePercent}
 mobileMoneyToday={data.mobileMoneyRevenueToday}
 activeSubscriptions={data.activeSubscriptionsCount}
 onlinePercentage={data.onlinePercentage}
 onlineCount={data.onlineSubscribersCount}
 smsCredits={data.smsCreditsCount}
 />

 {/* 4. Two-Column Operational Split */}
 <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
 <RenewalsDueCard items={data.renewalsDue} />
 <RouterTrafficCard items={data.routerTraffic} />
 </div>

 {/* 5. What's Next Action Queue | Today Activity Feed */}
 <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
 <div className="lg:col-span-2">
 <WhatsNextActionQueue items={data.whatsNextQueue} />
 </div>
 <TodayActivityFeed eventsCount={data.todayEventsCount} payments={data.todayRecentPayments} />
 </div>

 {/* 6. 7x24 Traffic Heatmap */}
 <NetworkPulseHeatmap heatmap={data.heatmap} />
 </div>
 </div>
 );
}