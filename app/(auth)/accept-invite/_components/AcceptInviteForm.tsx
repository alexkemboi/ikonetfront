"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { acceptInvitation } from "@/actions/usersAccess";
import type { InvitationPreview } from "@/lib/types/usersAccess";
import { cn } from "@/lib/utils";

const schema = Yup.object({
  username: Yup.string()
    .trim()
    .min(3, "At least 3 characters")
    .max(50, "At most 50 characters")
    .matches(/^[A-Za-z0-9._@-]+$/, "Letters, numbers and . _ @ - only")
    .required("Choose a username"),
  password: Yup.string().min(12, "At least 12 characters").max(128, "At most 128 characters").required("Choose a password"),
  confirm: Yup.string().oneOf([Yup.ref("password")], "The passwords do not match").required("Repeat the password"),
});

export default function AcceptInviteForm({ token, invitation }: { token: string; invitation: InvitationPreview }) {
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { username: "", password: "", confirm: "" },
    validationSchema: schema,
    onSubmit: async (values) => {
      setError(null);
      const res = await acceptInvitation(token, values.username.trim(), values.password);
      if (!res.success || !res.data) {
        setError(res.message || "The invitation could not be accepted.");
        return;
      }
      setDone(res.data.username);
    },
  });

  if (done) {
    return (
      <div className="space-y-4 rounded-2xl border border-success/30 bg-success/5 p-5">
        <p className="flex items-center gap-2 font-medium text-success"><CheckCircle2 className="size-5" /> Your account is ready</p>
        <p className="text-sm">Sign in with the username <b>{done}</b> and the password you chose.</p>
        <Button asChild className="w-full rounded-full"><Link href="/login">Go to sign in</Link></Button>
      </div>
    );
  }

  const err = (field: "username" | "password" | "confirm") => (formik.touched[field] ? formik.errors[field] : undefined);

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
      <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm">
        <p>Hello {invitation.fname}, you are invited to <b>{invitation.companyName ?? "the organisation"}</b>
          {invitation.roleName ? <> as <b>{invitation.roleName}</b></> : null}.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Account email: {invitation.email}. This link expires {new Date(invitation.expiresAt).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}.
        </p>
      </div>

      {error && (
        <Alert variant="destructive"><AlertDescription className="text-sm">{error}</AlertDescription></Alert>
      )}

      <div className="space-y-4 rounded-2xl border border-primary/30 bg-card p-5 shadow-xs">
        <div className="space-y-1.5">
          <Label htmlFor="invite-username">Username</Label>
          <Input id="invite-username" autoComplete="username" autoCapitalize="none" spellCheck={false}
            {...formik.getFieldProps("username")} aria-invalid={Boolean(err("username"))}
            className={cn("h-11", err("username") && "border-destructive")} />
          {err("username") && <p className="text-xs text-destructive">{err("username")}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-password">Password</Label>
          <div className="relative">
            <Input id="invite-password" type={show ? "text" : "password"} autoComplete="new-password"
              {...formik.getFieldProps("password")} aria-invalid={Boolean(err("password"))}
              className={cn("h-11 pr-10", err("password") && "border-destructive")} />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p className={cn("text-xs", err("password") ? "text-destructive" : "text-muted-foreground")}>
            {err("password") ?? "At least 12 characters."}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-confirm">Repeat password</Label>
          <Input id="invite-confirm" type={show ? "text" : "password"} autoComplete="new-password"
            {...formik.getFieldProps("confirm")} aria-invalid={Boolean(err("confirm"))}
            className={cn("h-11", err("confirm") && "border-destructive")} />
          {err("confirm") && <p className="text-xs text-destructive">{err("confirm")}</p>}
        </div>
        <Button type="submit" className="h-12 w-full rounded-full text-base" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Create my account"}
        </Button>
      </div>
    </form>
  );
}
