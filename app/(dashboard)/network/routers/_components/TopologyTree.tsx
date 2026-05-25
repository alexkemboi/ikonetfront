"use client";

import { TopologyNode, RouterNodeStatus } from "@/lib/types/network-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Network } from "lucide-react";
import { cn } from "@/lib/utils";

function nodeStatusStyle(status?: RouterNodeStatus) {
  switch (status) {
    case "ACTIVE":
      return { dot: "bg-success", badge: "bg-success/10 text-success border-success/20", label: "Active" };
    case "PASSIVE":
      return { dot: "bg-warning", badge: "bg-warning/10 text-warning border-warning/20", label: "Passive" };
    case "UNREGISTERED":
      return { dot: "bg-danger", badge: "bg-danger/10 text-danger border-danger/20", label: "Unregistered" };
    case "OFFLINE":
      return { dot: "bg-muted-foreground", badge: "bg-muted text-muted-foreground border-border", label: "Offline" };
    default:
      // Root Mikrotik nodes have no nodeStatus
      return { dot: "bg-primary", badge: "bg-primary/10 text-primary border-primary/20", label: "Mikrotik" };
  }
}

function TreeNode({
  node,
  depth,
  onSelectNode,
}: {
  node: TopologyNode;
  depth: number;
  onSelectNode: (node: TopologyNode) => void;
}) {
  const status = nodeStatusStyle(node.nodeStatus);
  const isRoot = depth === 0;

  return (
    <div className={cn(depth > 0 && "ml-5 border-l-2 border-border pl-4")}>
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 rounded-lg group transition-colors",
          "hover:bg-muted/40",
          isRoot
            ? "bg-muted/20 border border-border font-medium"
            : "border border-transparent hover:border-border"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={cn("w-2 h-2 rounded-full shrink-0", status.dot)} />
          <div className="min-w-0">
            <p
              className={cn(
                "text-sm truncate",
                isRoot ? "font-semibold text-foreground" : "font-medium text-foreground/80"
              )}
            >
              {node.name}
            </p>
            <p className="text-xs font-mono text-muted-foreground">{node.ipAddress}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className={cn("text-[10px] px-2 py-0 h-5 hidden sm:flex", status.badge)}
          >
            {status.label}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onSelectNode(node)}
          >
            Details
          </Button>
        </div>
      </div>

      {node.children.length > 0 && (
        <div className="mt-1 mb-1 space-y-1">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelectNode={onSelectNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TopologyTree({
  nodes,
  onSelectNode,
}: {
  nodes: TopologyNode[];
  onSelectNode: (node: TopologyNode) => void;
}) {
  if (nodes.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <Network className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-semibold text-foreground">No topology data</p>
        <p className="text-xs text-muted-foreground mt-1">
          No routers have been registered yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-auto max-h-[calc(100vh-380px)] min-h-72">
      <div className="p-4 space-y-2 min-w-105">
        {nodes.map((node) => (
          <TreeNode key={node.id} node={node} depth={0} onSelectNode={onSelectNode} />
        ))}
      </div>
    </div>
  );
}
