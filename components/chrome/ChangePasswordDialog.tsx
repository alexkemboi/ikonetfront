"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { changeOwnPasswordAction } from "@/actions/system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** "Change my password" for whoever is signed in. The server checks the current password. */
export default function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const problem =
    next.length > 0 && next.length < 12 ? "At least 12 characters."
      : confirm.length > 0 && confirm !== next ? "The two new passwords do not match."
      : next.length > 0 && next === current ? "Choose a password different from the current one."
      : null;
  const ready = current.length > 0 && next.length >= 12 && confirm === next && next !== current;

  const close = (value: boolean) => {
    if (!value) {
      setCurrent("");
      setNext("");
      setConfirm("");
    }
    onOpenChange(value);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    setBusy(true);
    try {
      const result = await changeOwnPasswordAction(current, next);
      if (!result.success) {
        toast.error("Password not changed", { description: result.message });
        return;
      }
      toast.success("Password changed", { description: "Use the new password next time you sign in." });
      close(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Change my password</DialogTitle>
            <DialogDescription>Enter your current password, then the new one twice.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <Input id="current-password" type="password" autoComplete="current-password" value={current}
              onChange={(e) => setCurrent(e.target.value)} disabled={busy} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" autoComplete="new-password" value={next}
              onChange={(e) => setNext(e.target.value)} disabled={busy} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">New password again</Label>
            <Input id="confirm-password" type="password" autoComplete="new-password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} disabled={busy} />
          </div>
          {problem && <p role="alert" className="text-sm text-destructive">{problem}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={busy || !ready}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
