"use client";

import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { changeRequiredPassword } from "@/actions/usersAccess";
import { cn } from "@/lib/utils";

const schema = Yup.object({
  newPassword: Yup.string().min(12, "At least 12 characters").max(128, "At most 128 characters").required("Choose a new password"),
  confirm: Yup.string().oneOf([Yup.ref("newPassword")], "The passwords do not match").required("Repeat the new password"),
});

/**
 * After signing in with a temporary (administrator-set) or expired password: the server lets the
 * token do nothing but change the password, so the person chooses one here before the dashboard opens.
 */
export default function PasswordChangeStep({
  token,
  currentPassword,
  reason,
  onChanged,
  onCancel,
}: {
  token: string;
  currentPassword: string;
  reason?: string;
  onChanged: () => Promise<void>;
  onCancel: () => void;
}) {
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { newPassword: "", confirm: "" },
    validationSchema: schema,
    onSubmit: async (values) => {
      setError(null);
      if (values.newPassword === currentPassword) {
        setError("Choose a password different from the one you signed in with.");
        return;
      }
      const res = await changeRequiredPassword(token, currentPassword, values.newPassword);
      if (!res.success) {
        setError(res.message || "The password could not be changed.");
        return;
      }
      await onChanged();
    },
  });

  const err = (f: "newPassword" | "confirm") => (formik.touched[f] ? formik.errors[f] : undefined);

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <p className="flex items-center gap-2 text-base font-medium"><KeyRound className="size-4 text-primary" /> Choose a new password</p>
        <p className="text-sm text-muted-foreground">
          {reason === "EXPIRED"
            ? "Your password has expired. Choose a new one to continue."
            : "You signed in with a temporary password. Choose your own to continue."}
        </p>
      </div>
      {error && <Alert variant="destructive"><AlertDescription className="text-sm">{error}</AlertDescription></Alert>}
      <div className="space-y-4 rounded-2xl border border-primary/30 bg-card p-5 shadow-xs">
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <div className="relative">
            <Input id="new-password" type={show ? "text" : "password"} autoComplete="new-password"
              {...formik.getFieldProps("newPassword")} aria-invalid={Boolean(err("newPassword"))}
              className={cn("h-11 pr-10", err("newPassword") && "border-destructive")} />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p className={cn("text-xs", err("newPassword") ? "text-destructive" : "text-muted-foreground")}>
            {err("newPassword") ?? "At least 12 characters. Recent passwords may not be reused."}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Repeat new password</Label>
          <Input id="confirm-password" type={show ? "text" : "password"} autoComplete="new-password"
            {...formik.getFieldProps("confirm")} aria-invalid={Boolean(err("confirm"))}
            className={cn("h-11", err("confirm") && "border-destructive")} />
          {err("confirm") && <p className="text-xs text-destructive">{err("confirm")}</p>}
        </div>
        <Button type="submit" className="h-12 w-full rounded-full text-base" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Save and continue"}
        </Button>
        <button type="button" onClick={onCancel} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
          Cancel and sign in again later
        </button>
      </div>
    </form>
  );
}
