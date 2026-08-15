"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { submitOutageCompensation } from "@/actions/subscribers";
import { cn } from "@/lib/utils";

type Policy = "PAUSE" | "COMPENSATE";

function OutageCompensationModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [policy, setPolicy] = useState<Policy>("PAUSE");
  const [minutes, setMinutes] = useState("");
  const [credit, setCredit] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setPolicy("PAUSE");
    setMinutes("");
    setCredit("");
    setReason("");
    setError("");
  }

  async function handleSubmit() {
    setError("");
    if (policy === "PAUSE") {
      const value = Number(minutes);
      if (!minutes || !isFinite(value) || value <= 0) {
        setError("Enter a valid duration in minutes.");
        return;
      }
    } else {
      const value = Number(credit);
      if (!credit || !isFinite(value) || value < 0) {
        setError("Enter a valid credit amount.");
        return;
      }
    }

    setSubmitting(true);
    const base = {
      policy,
      reason: reason.trim() || "Scheduled outage compensation",
      routerId: 1,
    };
    const result = await submitOutageCompensation(
      policy === "PAUSE"
        ? {
            ...base,
            durationMinutes: Math.max(1, Number(minutes)),
          }
        : {
            ...base,
            creditKsh: Math.max(0, Number(credit)),
          }
    );
    setSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        reset();
        onClose();
      }, 1500);
    } else {
      setError(result.message);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="bg-[#161616] text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            Outage Compensation
          </DialogTitle>
          <DialogDescription>
            Apply a temporary pause or a billing credit to subscribers hit by
            the outage on router 1.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <p className="text-sm font-medium text-emerald-300">
              Compensation applied
            </p>
            <p className="text-xs text-zinc-500">Closing…</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Policy selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPolicy("PAUSE")}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left transition-colors",
                  policy === "PAUSE"
                    ? "border-amber-400/50 bg-amber-400/10"
                    : "border-[#262626] bg-[#121212] hover:border-zinc-500"
                )}
              >
                <p className="text-sm font-semibold text-zinc-100">Pause</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  Extend session by minutes
                </p>
              </button>
              <button
                type="button"
                onClick={() => setPolicy("COMPENSATE")}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left transition-colors",
                  policy === "COMPENSATE"
                    ? "border-emerald-400/50 bg-emerald-400/10"
                    : "border-[#262626] bg-[#121212] hover:border-zinc-500"
                )}
              >
                <p className="text-sm font-semibold text-zinc-100">
                  Compensate
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  Apply KSh service credit
                </p>
              </button>
            </div>

            {policy === "PAUSE" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">
                  Duration (minutes)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="e.g. 120"
                  className="border-[#262626] bg-[#121212] text-zinc-100 placeholder:text-zinc-600"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">
                  Credit (KSh)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={credit}
                  onChange={(e) => setCredit(e.target.value)}
                  placeholder="e.g. 500"
                  className="border-[#262626] bg-[#121212] text-zinc-100 placeholder:text-zinc-600"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">
                Reason
              </label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Backbone outage 08:00-12:00"
                className="border-[#262626] bg-[#121212] text-zinc-100 placeholder:text-zinc-600"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-[#262626] bg-[#121212] text-zinc-300 hover:text-zinc-100"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  (policy === "PAUSE"
                    ? !(minutes && isFinite(Number(minutes)) && Number(minutes) > 0)
                    : !(credit && isFinite(Number(credit)) && Number(credit) >= 0))
                }
                className="bg-amber-500 text-zinc-950 hover:bg-amber-400"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Applying…
                  </>
                ) : (
                  "Apply Compensation"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { OutageCompensationModal };