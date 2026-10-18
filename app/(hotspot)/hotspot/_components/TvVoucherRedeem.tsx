"use client";

import { useState } from "react";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redeemTvVoucherAction, type TvVoucherRedemption } from "@/actions/tv";
import { getPortalRouter } from "@/lib/hotspot/portalRouter";

interface Props {
  portalToken: string;
}

function formatUntil(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** "Have a voucher?" on the TV package step: the voucher is used for the TV confirmed above. */
export default function TvVoucherRedeem({ portalToken }: Props) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<TvVoucherRedemption | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!code.trim()) { setError("Enter the voucher code."); return; }
    setBusy(true);
    try {
      const result = await redeemTvVoucherAction(code, portalToken, getPortalRouter());
      if (result.success) setDone(result.data);
      else setError(result.error);
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    const until = formatUntil(done.tvAccessExpiresAt);
    return (
      <div role="status" className="rounded-lg border border-success/30 bg-success/10 p-5 space-y-2">
        <p className="font-medium">
          {done.alreadyRedeemed ? "This voucher is already on this TV." : done.extended ? "Time added to your TV." : "Your TV is connected."}
        </p>
        <p className="text-sm">
          {done.packageName}{until ? ` · internet until ${until}` : ""}.
        </p>
        <p className="text-sm text-muted-foreground">
          If the TV is not online within a minute, turn its Wi-Fi off and on again.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" className="w-full" onClick={() => setOpen(true)}>
        <Ticket className="size-4" /> I have a TV voucher
      </Button>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-lg border border-border bg-card p-5 space-y-3">
      <Label htmlFor="tv-voucher-code">TV voucher code</Label>
      <Input
        id="tv-voucher-code"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        placeholder="Code printed on the voucher"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "tv-voucher-error" : undefined}
      />
      {error && <p id="tv-voucher-error" role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Checking voucher…" : "Use voucher for this TV"}</Button>
    </form>
  );
}
