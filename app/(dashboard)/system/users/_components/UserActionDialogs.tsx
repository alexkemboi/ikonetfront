"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetSystemUserPassword } from "@/actions/system";
import { withStepUp } from "@/lib/stepUp";

export type PendingConfirm = {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  /** Returns an error message to keep the dialog open, or nothing when done. */
  run: () => Promise<string | void>;
};

/** Confirmation for sensitive actions; stays open with a spinner while the action runs. */
export function ConfirmDialog({ pending, onClose }: { pending: PendingConfirm | null; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      const error = await pending.run();
      if (!error) onClose();
    } finally {
      setBusy(false);
    }
  };
  return (
    <AlertDialog open={Boolean(pending)} onOpenChange={(open) => !open && !busy && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{pending?.title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground">{pending?.description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <Button
            onClick={confirm}
            disabled={busy}
            variant={pending?.destructive ? "destructive" : "default"}
          >
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
            {pending?.confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * An administrator sets a temporary password for someone else. Re-authentication is asked first
 * (step-up). The account is unlocked and signed out everywhere; with "Require password change after
 * reset" on, the person must choose a new password at their next sign-in.
 */
export function ResetPasswordDialog({
  target,
  requireChange,
  onClose,
  onDone,
}: {
  target: { id: number; name: string } | null;
  /** The organisation's "require password change after reset" setting, to say what happens next. */
  requireChange?: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const tooShort = password.length > 0 && password.length < 12;

  const close = () => {
    setPassword("");
    setShow(false);
    onClose();
  };

  const submit = async () => {
    if (!target || password.length < 12) return;
    setBusy(true);
    try {
      const result = await withStepUp(
        (token) => resetSystemUserPassword(target.id, password, token),
        "Setting someone else's password requires re-authentication."
      );
      if (!result.success) {
        toast.error("Could not reset the password", { description: result.message });
        return;
      }
      toast.success("Password reset", {
        description: `Give the new password to ${target.name} in person or by phone. They were signed out everywhere${
          requireChange ? " and must choose a new password when they sign in" : ""}.`,
      });
      onDone();
      close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && !busy && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Set a temporary password for {target?.name}. This also unlocks the account and ends all of its sessions.
            You will be asked to confirm your own identity first.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="reset-password">New password</Label>
          <div className="relative">
            <Input
              id="reset-password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              aria-invalid={tooShort}
              aria-describedby="reset-password-help"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p id="reset-password-help" className={tooShort ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
            At least 12 characters.{requireChange ? " The person must replace it at their next sign-in." : ""}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy || password.length < 12}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Set password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
