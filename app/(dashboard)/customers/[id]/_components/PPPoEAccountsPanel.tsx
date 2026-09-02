"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  suspendPppoeAccountAction,
  activatePppoeAccountAction,
  renewPppoeSubscriptionAction,
} from "@/actions/pppoe";
import type { PppoeAccountResponse, PppoeSubscriptionResponse } from "@/lib/types/pppoe";

interface PPPoEAccountsPanelProps {
 customerId: string;
 accounts: PppoeAccountResponse[];
 subscriptions: PppoeSubscriptionResponse[];
}

export function PPPoEAccountsPanel({
 customerId,
 accounts,
 subscriptions,
}: PPPoEAccountsPanelProps) {
 const [busyId, setBusyId] = useState<string | null>(null);

 async function run(action: Promise<{ success: boolean; message: string }>, id: string, label: string) {
 setBusyId(id);
 const res = await action;
 setBusyId(null);
 if (res.success) {
 toast.success(res.message || `${label} succeeded.`);
 } else {
 toast.error(res.message || `${label} failed.`);
 }
 }

 return (
 <div className="space-y-6">
 <Card>
 <CardHeader>
  <CardTitle className="text-base">PPPoE Accounts</CardTitle>
 </CardHeader>
 <CardContent className="space-y-3">
  {accounts.length === 0 ? (
  <p className="text-sm text-muted-foreground">
   No PPPoE accounts on file for this customer.
  </p>
  ) : (
  accounts.map((account) => (
  <div
   key={account.id}
   className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
  >
  <div className="min-w-0">
   <p className="text-sm font-medium text-foreground truncate">
   {account.username}
   </p>
   <p className="text-xs text-muted-foreground truncate">
   {account.routerIp || "—"} {account.physicalLocation ? `· ${account.physicalLocation}` : ""}
   </p>
  </div>
  <div className="flex items-center gap-2 shrink-0">
   <Badge
   variant="outline"
   className={
   account.status === "ACTIVE"
   ? "bg-success/10 text-success border-success/20"
   : account.status === "SUSPENDED"
   ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
   : "bg-muted text-muted-foreground border-border"
   }
   >
  {account.status}
   </Badge>
   {account.status === "ACTIVE" ? (
   <Button
   size="sm"
   variant="outline"
   disabled={busyId === account.id}
   onClick={() =>
   run(suspendPppoeAccountAction(account.id), account.id, "Suspend")
   }
   >
   Suspend
   </Button>
   ) : account.status === "SUSPENDED" ? (
   <Button
   size="sm"
   variant="outline"
   disabled={busyId === account.id}
   onClick={() =>
   run(activatePppoeAccountAction(account.id), account.id, "Activate")
   }
   >
   Activate
   </Button>
   ) : null}
  </div>
  </div>
  ))
  )}
 </CardContent>
 </Card>

 <Card>
 <CardHeader>
  <CardTitle className="text-base">PPPoE Subscriptions</CardTitle>
 </CardHeader>
 <CardContent className="space-y-3">
  {subscriptions.length === 0 ? (
  <p className="text-sm text-muted-foreground">
   No PPPoE subscriptions for this customer.
  </p>
  ) : (
  subscriptions.map((sub) => (
  <div
   key={sub.id}
   className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
  >
  <div className="min-w-0">
   <p className="text-sm font-medium text-foreground truncate">{sub.packageName}</p>
   <p className="text-xs text-muted-foreground">
   {sub.startDate} → {sub.expiryDate} · {sub.daysRemaining} days left
   </p>
  </div>
  <div className="flex items-center gap-2 shrink-0">
   <Badge
   variant="outline"
   className={
   sub.status === "ACTIVE"
   ? "bg-success/10 text-success border-success/20"
   : "bg-muted text-muted-foreground border-border"
   }
   >
  {sub.status}
   </Badge>
   {sub.status !== "ACTIVE" && (
   <Button
   size="sm"
   variant="outline"
   disabled={busyId === `renew-${sub.id}`}
   onClick={() =>
   run(
   renewPppoeSubscriptionAction(customerId, sub.accountId),
   `renew-${sub.id}`,
   "Renewal"
   )
   }
   >
   Renew
   </Button>
   )}
  </div>
  </div>
  ))
  )}
 </CardContent>
 </Card>
 </div>
 );
}