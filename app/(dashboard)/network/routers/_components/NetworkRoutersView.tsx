"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Network, Clock, GitBranch, AlertTriangle, type LucideIcon } from "lucide-react";
import { TopologyNode, NetworkRouter } from "@/lib/types/network-router";
import TopologyTree from "./TopologyTree";
import PendingRoutersList from "./PendingRoutersList";
import FinalizeRouterSheet from "./FinalizeRouterSheet";
import RouterDetailSheet from "./RouterDetailSheet";

interface Props {
  initialTopology: TopologyNode[];
  initialPending: NetworkRouter[];
}

// Recursively count all nodes in the topology tree
function countNodes(nodes: TopologyNode[]): number {
  return nodes.reduce((acc, node) => acc + 1 + countNodes(node.children), 0);
}

// Count nodes matching a predicate (recursive)
function countWhere(nodes: TopologyNode[], pred: (n: TopologyNode) => boolean): number {
  return nodes.reduce(
    (acc, node) =>
      acc + (pred(node) ? 1 : 0) + countWhere(node.children, pred),
    0
  );
}

function StatCard({
  label,
  value,
  Icon,
  highlight = false,
}: {
  label: string;
  value: number;
  Icon: LucideIcon;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        highlight
          ? "border-warning/40 bg-warning/5"
          : "border-border bg-card"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon
          className={cn(
            "w-4 h-4",
            highlight ? "text-warning" : "text-muted-foreground"
          )}
        />
      </div>
      <span
        className={cn(
          "text-2xl font-bold tabular-nums",
          highlight ? "text-warning" : "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}

export default function NetworkRoutersView({ initialTopology, initialPending }: Props) {
  const router = useRouter();

  // UI state only — no fetched data stored in state
  const [finalizeTarget, setFinalizeTarget] = useState<NetworkRouter | null>(null);
  const [detailTarget, setDetailTarget] = useState<TopologyNode | null>(null);

  // Poll every 30 s by refreshing the server component — no state involved
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(interval);
  }, [router]);

  const totalRouters = countNodes(initialTopology);
  const passiveCount = countWhere(
    initialTopology,
    (n) => n.nodeStatus === "PASSIVE" || n.name === "UNREGISTERED"
  );
  const pendingCount = initialPending.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Network Routers</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage topology, finalize new devices, and run remote actions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Routers" value={totalRouters} Icon={Network} />
        <StatCard label="Root Nodes" value={initialTopology.length} Icon={GitBranch} />
        <StatCard
          label="Needs Attention"
          value={passiveCount}
          Icon={AlertTriangle}
          highlight={passiveCount > 0}
        />
        <StatCard
          label="Pending Setup"
          value={pendingCount}
          Icon={Clock}
          highlight={pendingCount > 0}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="topology">
        <TabsList className="h-9">
          <TabsTrigger value="topology" className="text-sm">
            Topology
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-sm gap-2">
            Pending Setup
            {pendingCount > 0 && (
              <Badge className="h-4 px-1.5 text-[10px] bg-warning text-warning-foreground rounded-full">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="topology" className="mt-4">
          <TopologyTree
            nodes={initialTopology}
            onSelectNode={setDetailTarget}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <PendingRoutersList
            pending={initialPending}
            onFinalize={setFinalizeTarget}
          />
        </TabsContent>
      </Tabs>

      <FinalizeRouterSheet
        router={finalizeTarget}
        onClose={() => setFinalizeTarget(null)}
      />
      <RouterDetailSheet
        node={detailTarget}
        onClose={() => setDetailTarget(null)}
      />
    </div>
  );
}
