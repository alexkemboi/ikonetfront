"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendCompanyInvestorsMessage, sendInvestorMessage } from "@/actions/investorMessages";
import type { InvestorMessageDelivery } from "@/lib/types/investorMessages";

const SMS_MAX = 480;

/**
 * The platform administrator writes to one investor, or to every active investor linked to
 * the company selected in the top bar: by email (the investor's logins and own address)
 * and/or text (the same people's phones). Who could not be reached is listed after sending.
 */
export default function MessageInvestorsDialog({
  target,
  label,
  variant = "outline",
  open: openProp,
  onOpenChange,
}: {
  target: { kind: "one"; investorId: string; name: string } | { kind: "company"; companyCode: string | null };
  label: string;
  variant?: "outline" | "default";
  /** Opened from elsewhere (a row's actions menu): no button of its own. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [openOwn, setOpenOwn] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : openOwn;
  const setOpen = (value: boolean) => (controlled ? onOpenChange?.(value) : setOpenOwn(value));
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [smsText, setSmsText] = useState("");
  const [result, setResult] = useState<InvestorMessageDelivery[] | null>(null);

  const who = target.kind === "one" ? target.name : `every investor of ${target.companyCode ?? "the selected company"}`;
  const textPreview = (smsText.trim() || body.trim().replace(/\s+/g, " ")).slice(0, SMS_MAX);

  const reset = () => {
    setSubject("");
    setBody("");
    setSmsText("");
    setResult(null);
  };

  const send = () => {
    if (!email && !sms) return toast.error("Choose email, text message, or both.");
    if (!body.trim()) return toast.error("Write the message.");
    if (email && !subject.trim()) return toast.error("An email needs a subject.");
    if (sms && smsText.trim().length > SMS_MAX) return toast.error(`A text message may be ${SMS_MAX} characters.`);
    const input = { subject: subject.trim(), body: body.trim(), smsText: smsText.trim() || undefined, email, sms };
    startTransition(async () => {
      const res = target.kind === "one"
        ? await sendInvestorMessage(target.investorId, input)
        : await sendCompanyInvestorsMessage(input);
      if (!res.success || !res.data) {
        toast.error(res.message || "The message was not sent");
        return;
      }
      const d = res.data.deliveries;
      const emails = d.reduce((n, x) => n + x.emails, 0);
      const texts = d.reduce((n, x) => n + x.texts, 0);
      toast.success(`Queued ${emails} email${emails === 1 ? "" : "s"} and ${texts} text${texts === 1 ? "" : "s"}`);
      setResult(d);
      router.refresh();
    });
  };

  return (
    <>
      {!controlled && <Button
        variant={variant}
        onClick={() => {
          if (target.kind === "company" && !target.companyCode) {
            toast.error("Choose a company in the top bar: its investors are the ones written to.");
            return;
          }
          reset();
          setOpen(true);
        }}
      >
        <Mail className="mr-2 size-4" /> {label}
      </Button>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Message {who}</DialogTitle>
            <DialogDescription>
              Email goes to the investor&apos;s logins and the investor&apos;s own address; a text to the same people&apos;s
              phones, charged to {target.kind === "company" ? target.companyCode : "the investor's company"}&apos;s SMS
              account. Every message is kept on the investor&apos;s page.
            </DialogDescription>
          </DialogHeader>

          {result ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium">Sent</p>
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {result.map((d) => (
                  <li key={d.investorId} className="flex flex-wrap justify-between gap-2 border-b border-border py-1">
                    <span>{d.investorName} <span className="font-mono text-xs text-muted-foreground">{d.investorCode}</span></span>
                    <span className="tabular-nums text-muted-foreground">
                      {d.emails} email · {d.texts} text{d.note ? ` · ${d.note}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <DialogFooter>
                <Button onClick={() => setOpen(false)}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-6 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /> Email
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} /> Text message (SMS)
                </label>
              </div>
              {email && (
                <div className="space-y-1">
                  <Label htmlFor="msg-subject">Subject</Label>
                  <Input id="msg-subject" value={subject} maxLength={200} onChange={(e) => setSubject(e.target.value)} />
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="msg-body">Message</Label>
                <textarea
                  id="msg-body"
                  rows={6}
                  maxLength={5000}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              {sms && (
                <div className="space-y-1">
                  <Label htmlFor="msg-sms">Text message (optional)</Label>
                  <textarea
                    id="msg-sms"
                    rows={2}
                    maxLength={SMS_MAX}
                    value={smsText}
                    placeholder="Leave empty to text the start of the message"
                    onChange={(e) => setSmsText(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {textPreview.length}/{SMS_MAX} characters{textPreview.length > 160 ? " · sent as more than one SMS" : ""}
                  </p>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={send} disabled={pending}>
                  {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Send
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
