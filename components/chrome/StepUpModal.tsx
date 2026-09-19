"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert } from "lucide-react";

type StepUpModalProps = {
  open: boolean;
  reason?: string;
  onVerify: (password: string) => Promise<string | null>;
  onVerified: (token: string | null) => void;
  onCancel: () => void;
};

/**
 * Clean high-security dialog: re-entering the operator's password issues a
 * 10-minute step-up token. The token stays in memory only (StepUpProvider).
 */
export default function StepUpModal({
  open,
  reason,
  onVerify,
  onVerified,
  onCancel,
}: StepUpModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      setError("Enter your password to continue.");
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const token = await onVerify(password);
      if (token) {
        setPassword("");
        onVerified(token);
      } else {
        setError("Verification failed. Check your password and try again.");
      }
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            Protected security area
          </DialogTitle>
          <DialogDescription>
            {reason ?? "Confirm your password to continue."} Your elevation lasts 10 minutes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="password"
            autoFocus
            placeholder="Current password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={verifying}>
              Cancel
            </Button>
            <Button type="submit" disabled={verifying || !password}>
              {verifying ? "Verifying…" : "Continue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}