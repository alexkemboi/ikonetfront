import { TriangleAlert } from "lucide-react";
import { getSubscribersData } from "@/actions/subscribers";
import { getCurrentUserPermissions, NO_PERMISSIONS } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import { SubscribersHeaderActions } from "@/components/subscribers/SubscribersHeaderActions";
import { SubscriberKpiCards } from "@/components/subscribers/SubscriberKpiCards";
import { SubscriberDataTable } from "@/components/subscribers/SubscriberDataTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "Subscribers — IBS" };

export default async function SubscribersPage() {
  const permissions = await getCurrentUserPermissions();
  const pagePerms = permissions["/customers"] ?? NO_PERMISSIONS;
  if (!pagePerms.canView) redirect("/dashboard");

  const { kpis, subscribers } = await getSubscribersData();

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-4 text-zinc-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">
              Customers — Subscribers
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
              Your subscribers.
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {kpis.allUsersCount.toLocaleString()} accounts ·{" "}
              {kpis.onlineCount} online right now
            </p>
          </div>
          <SubscribersHeaderActions subscribers={subscribers} />
        </div>

        {/* At-risk callout */}
        {kpis.atRiskCount > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-sm leading-relaxed text-amber-200/90">
              <span className="font-semibold text-amber-300">
                {kpis.atRiskCount}
              </span>{" "}
              subscriber{kpis.atRiskCount === 1 ? "" : "s"} at risk — no recent
              activity or no active subscription. Review them before service
              cuts off.
            </p>
          </div>
        )}

        <SubscriberKpiCards kpis={kpis} />
        <SubscriberDataTable subscribers={subscribers} />
      </div>
    </div>
  );
}