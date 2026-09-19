"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { compensateOutage, previewCompensation } from "@/actions/network";
import { withStepUp } from "@/lib/stepUp";

const PRESETS = [2, 6, 12, 24, 48];

type Props = {
  open: boolean;
  onClose: () => void;
  deviceId?: number;
  stationId?: number;
  targetLabel: string;
};

/** Whole-day credits, step-up gated (Track 6 Phase 4). */
export default function CompensateOutageModal({
  open,
  onClose,
  deviceId,
  stationId,
  targetLabel,
}: Props) {
  const router = useRouter();
  const [hours, setHours] = useState(6);
  const [reason, setReason] = useState("");
  const [notify, setNotify] = useState(true);
  const [preview, setPreview] = useState<{ affected: number; days: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshPreview = useCallback(async () => {
    const result = await previewCompensation(deviceId, hours);
    setPreview(result ? { affected: result.affectedSubscriptions, days: result.extensionDays } : null);
  }, [deviceId, hours]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handle = setTimeout(() => void refreshPreview(), 0);
    return () => clearTimeout(handle);
  }, [open, refreshPreview]);

  const effectiveDays = useMemo(() => Math.max(1, Math.ceil(hours / 24)), [hours]);

  async function submit() {
    if (!reason.trim()) {
      toast.error("Describe the outage so the audit trail is complete.");
      return;
    }
    setBusy(true);
    const body = {
      deviceId,
      stationId,
      extensionHours: hours,
      reason: reason.trim(),
      notifyBySms: notify,
    };
    const res = await withStepUp(
      (token) => (deviceId !== undefined || stationId !== undefined
        ? compensateOutage(body as Parameters<typeof compensateOutage>[0], token)
        : Promise.resolve({ success: false, message: "No target selected", data: null, status: 400, timestamp: "" })),
      "Applying outage compensation requires re-authentication."
    );
    setBusy(false);
    if (res.success && res.data) {
      toast.success(
        `Extended ${res.data.affectedSubscriptions} active subscription(s) by ${res.data.extensionDays} day(s).`
      );
      onClose();
      router.refresh();
    } else {
      toast.error(res.message || "Failed to apply compensation.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Compensate subscribers</DialogTitle>
          <DialogDescription>
            Extends active subscriptions on <span className="font-medium text-foreground">{targetLabel}</span> by whole
            service days. Active online sessions are never disconnected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Outage duration</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHours(h)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    hours === h
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Credits <span className="font-semibold text-foreground">{effectiveDays}</span> bonus{" "}
              {effectiveDays === 1 ? "day" : "days"} per active subscription.
            </p>
          </div>

          {preview && (
            <div className="rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
              {preview.affected === 0 ? (
                "No active, future-dated subscriptions on this router/station — nothing to extend."
              ) : (
                <>
                  This action will extend{" "}
                  <span className="font-semibold text-foreground">{preview.affected}</span> active subscriber
                  {preview.affected === 1 ? "" : "s"} by {preview.days} {preview.days === 1 ? "day" : "days"}.
                </>
              )}
            </div>
          )}

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Outage reason — e.g. Fiber cut at Likoni ferry"
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
          />

          <label className="flex items-center gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="h-3.5 w-3.5 accent-primary"
            />
            Notify affected customers via SMS
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={busy || !preview || preview.affected === 0 || !reason.trim()}
          >
            {busy ? "Applying…" : "Apply compensation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}