"use client";

import { useEffect, useState } from "react";
import { Boxes } from "lucide-react";
import { getPppoeOverview } from "@/actions/customer360";
import {
  CustomerPppoeOverview,
  PppoeAccountSummary,
  PppoeSubscriptionSummary,
} from "@/lib/types/customer360";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCustomerDate } from "@/lib/utils/customerFormatters";
import { EmptyState, DataLoadError } from "./EmptyState";
import { ManagePppoeSubscriptionDialog } from "./ManagePppoeSubscriptionDialog";
import { Button } from "@/components/ui/button";

interface PackagesTabProps {
  customerId: number;
}

const EMPTY_OVERVIEW: CustomerPppoeOverview = { accounts: [], subscriptions: [] };

function accountStatusBadge(account: PppoeAccountSummary) {
  const active = account.isActive === true && (account.status ?? "").toUpperCase() === "ACTIVE";
  return active ? (
    <Badge className="bg-success text-foreground">ACTIVE</Badge>
  ) : (
    <Badge variant="outline">{account.status ?? "INACTIVE"}</Badge>
  );
}

function subscriptionStatusBadge(subscription: PppoeSubscriptionSummary) {
  const active = subscription.isActive === true && (subscription.status ?? "").toUpperCase() === "ACTIVE";
  return active ? (
    <Badge className="bg-success text-foreground">ACTIVE</Badge>
  ) : (
    <Badge variant="outline">{subscription.status ?? "INACTIVE"}</Badge>
  );
}

export function PackagesTab({ customerId }: PackagesTabProps) {
  const [overview, setOverview] = useState<CustomerPppoeOverview>(EMPTY_OVERVIEW);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [managed, setManaged] = useState<PppoeSubscriptionSummary | null>(null);
  /** Bumped after add time / pause / resume so the table shows the new dates. */
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getPppoeOverview(customerId).then((res) => {
      if (cancelled) return;
      if (res?.success && res.data) setOverview(res.data);
      setError(!res?.success);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [customerId, reloadKey]);

  return (
    <div className="space-y-6">
      {error ? (
        <DataLoadError message="Unable to load PPPoE accounts for this customer." />
      ) : (
        <>
          <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-normal">
            <Boxes className="h-4 w-4 text-primary" />
            PPPoE accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loaded ? (
            <p className="text-sm text-muted-foreground">Loading accounts…</p>
          ) : overview.accounts.length === 0 ? (
            <EmptyState message="No PPPoE accounts linked to this customer." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Router IP</TableHead>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-sans tabular-nums font-medium">
                      {account.username}
                    </TableCell>
                    <TableCell className="font-sans tabular-nums">
                      {account.routerIp || "—"}
                    </TableCell>
                    <TableCell className="font-sans tabular-nums">
                      {account.networkDeviceId ?? "—"}
                    </TableCell>
                    <TableCell>{accountStatusBadge(account)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-normal">
            <Boxes className="h-4 w-4 text-primary" />
            Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loaded ? (
            <p className="text-sm text-muted-foreground">Loading subscriptions…</p>
          ) : overview.subscriptions.length === 0 ? (
            <EmptyState message="No subscriptions linked to this customer." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">
                      {subscription.packageName || "—"}
                    </TableCell>
                    <TableCell className="font-sans tabular-nums">
                      {formatCustomerDate(subscription.startDate)}
                    </TableCell>
                    <TableCell className="font-sans tabular-nums">
                      {formatCustomerDate(subscription.expiryDate)}
                    </TableCell>
                    <TableCell>{subscriptionStatusBadge(subscription)}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => setManaged(subscription)}>
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
        </>
      )}
      <ManagePppoeSubscriptionDialog
        subscription={managed}
        onClose={() => setManaged(null)}
        onChanged={() => setReloadKey((key) => key + 1)}
      />
    </div>
  );
}