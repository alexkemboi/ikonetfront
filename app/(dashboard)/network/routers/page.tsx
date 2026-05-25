import { Suspense } from "react";
import { getTopologyTree, getPendingRouters } from "@/actions/network";
import { TopologyNode, NetworkRouter } from "@/lib/types/network-router";
import NetworkRoutersView from "./_components/NetworkRoutersView";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Network Routers — Beesmart" };

// Fetches data on the server and streams it down wrapped in Suspense
async function RouterContent() {
  const [topologyRes, pendingRes] = await Promise.all([
    getTopologyTree(),
    getPendingRouters(),
  ]);

  const topology: TopologyNode[] = topologyRes.success ? topologyRes.data : [];
  const pending: NetworkRouter[] = pendingRes.success ? pendingRes.data : [];

  return <NetworkRoutersView initialTopology={topology} initialPending={pending} />;
}

function RouterSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-64 rounded-lg" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

export default function NetworkRoutersPage() {
  return (
    <div className="p-6 h-full">
      <Suspense fallback={<RouterSkeleton />}>
        <RouterContent />
      </Suspense>
    </div>
  );
}
