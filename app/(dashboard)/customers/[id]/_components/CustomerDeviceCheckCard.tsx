"use client";

import { useState } from "react";
import { Router } from "lucide-react";
import { checkCustomerDevice, type CustomerDeviceCheck } from "@/actions/customer360";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATE_LABEL: Record<CustomerDeviceCheck["state"], string> = {
  REACHABLE: "Answering",
  NO_REPLY: "Connected, no reply",
  SESSION_OFFLINE: "Not connected",
  NO_PPPOE_ACCOUNT: "No PPPoE account",
  NO_ROUTER: "No router linked",
  ROUTER_UNREACHABLE: "Router unreachable",
};

/**
 * On-demand test of the customer's own router (the device at their premises), run from
 * the MikroTik that serves their PPPoE session. It shows whether the device is connected
 * and answering; it cannot see inside the device (Wi-Fi clients, signal, settings).
 */
export function CustomerDeviceCheckCard({ customerId }: { customerId: number }) {
  const [result, setResult] = useState<CustomerDeviceCheck | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setError("");
    try {
      const res = await checkCustomerDevice(customerId);
      if (res.success && res.data) setResult(res.data);
      else setError(res.message || "The test could not be run.");
    } catch {
      setError("The test could not be run.");
    } finally {
      setBusy(false);
    }
  }

  const good = result?.state === "REACHABLE";
  const facts: [string, string | undefined][] = result
    ? [
        ["PPPoE user", result.pppoeUsername],
        ["Served by", result.routerName],
        ["Session address", result.sessionAddress],
        ["Device MAC", result.deviceMac],
        ["Connected for", result.sessionUptime],
        ["Replies", result.sent != null ? `${result.received ?? 0} of ${result.sent}` : undefined],
        ["Average round trip", result.avgRttMs != null ? `${result.avgRttMs} ms` : undefined],
      ]
    : [];

  return (
    <Card className="mt-6 border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Router className="h-4 w-4 text-primary" /> Customer&apos;s router
        </CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={run} disabled={busy}>
          {busy ? "Testing…" : result ? "Test again" : "Test connection"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!result && !error && (
          <p className="text-muted-foreground">
            Checks whether the customer&apos;s router is connected and answering. Takes about four seconds.
          </p>
        )}
        {error && <p role="alert" className="text-destructive">{error}</p>}
        {result && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={good ? "default" : result.state === "NO_REPLY" ? "secondary" : "destructive"}>
                {STATE_LABEL[result.state]}
              </Badge>
              <span>{result.message}</span>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {facts.filter(([, value]) => value).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="tabular-nums font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </CardContent>
    </Card>
  );
}
