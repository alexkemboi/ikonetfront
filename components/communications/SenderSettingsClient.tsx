"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSenderSettings, type SenderSettings } from "@/actions/communications";

const blankToNull = (value: string) => (value.trim() === "" ? null : value.trim());

/**
 * The sender this company's messages go out under. Every field is optional: left empty,
 * NotifyHub uses the sender set up for the business there. An SMS sender ID must be
 * approved by the SMS provider (e.g. Africa's Talking) before it is entered here.
 */
export function SenderSettingsClient({ initial, canEdit }: { initial: SenderSettings | null; canEdit: boolean }) {
  const [value, setValue] = useState({
    smsSenderId: initial?.smsSenderId ?? "",
    emailFromName: initial?.emailFromName ?? "",
    emailFromAddress: initial?.emailFromAddress ?? "",
    emailReplyTo: initial?.emailReplyTo ?? "",
  });
  const [pending, startTransition] = useTransition();

  const field = (key: keyof typeof value) => ({
    value: value[key],
    disabled: !canEdit || pending,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValue((v) => ({ ...v, [key]: e.target.value })),
  });

  const save = () =>
    startTransition(async () => {
      const res = await saveSenderSettings({
        smsSenderId: blankToNull(value.smsSenderId),
        emailFromName: blankToNull(value.emailFromName),
        emailFromAddress: blankToNull(value.emailFromAddress),
        emailReplyTo: blankToNull(value.emailReplyTo),
      });
      if (res.success) toast.success("Sender settings saved. New messages use them straight away.");
      else toast.error(res.message ?? "The sender settings could not be saved.");
    });

  return (
    <section aria-label="Sender settings" className="max-w-2xl space-y-6 rounded-2xl border border-border bg-card p-6">
      <div>
        <h2 className="text-lg font-normal text-foreground">Sender settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Who your customers see as the sender. Leave a field empty to use the default sender set up in NotifyHub.
          Changes apply to every new SMS and email from this company, with no update needed.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sms-sender">SMS sender ID</Label>
        <Input id="sms-sender" maxLength={11} placeholder="e.g. BEDAK" {...field("smsSenderId")} />
        <p className="text-xs text-muted-foreground">
          3 to 11 letters, digits or spaces, exactly as approved by the SMS provider (for example Africa&apos;s
          Talking). Enter it only once it is approved, or messages may be refused.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email-name">Email sender name</Label>
          <Input id="email-name" maxLength={80} placeholder="e.g. Bedak Internet" {...field("emailFromName")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email-from">Email sender address</Label>
          <Input id="email-from" type="email" placeholder="care@yourcompany.co.ke" {...field("emailFromAddress")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email-reply">Replies go to</Label>
        <Input id="email-reply" type="email" placeholder="support@yourcompany.co.ke" {...field("emailReplyTo")} />
        <p className="text-xs text-muted-foreground">
          The sender address must be allowed for your business in NotifyHub (its domain verified there).
        </p>
      </div>

      {canEdit ? (
        <Button onClick={save} disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save sender settings
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">Only a company administrator can change these.</p>
      )}
    </section>
  );
}
