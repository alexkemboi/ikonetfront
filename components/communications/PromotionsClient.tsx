"use client";

import { useCallback, useEffect, useState } from "react";
import { Megaphone, Send, UserX, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { visibleInterval } from "@/lib/hooks/useVisibleInterval";
import {
  addOptOut, cancelPromotion, getOptOuts, getPromotions, previewPromotion, removeOptOut, saveDraft, sendPromotion,
} from "@/actions/promotions";
import type { OptOutChannel, Promotion, PromotionOptOut, PromotionPreview } from "@/lib/types/promotions";

const MAX_MESSAGE = 600;
const CHANNELS: { value: OptOutChannel; label: string }[] = [
  { value: "CALL", label: "Phone call" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "IN_PERSON", label: "In person" },
  { value: "OTHER", label: "Other" },
];

/**
 * Promotional SMS to the company's customers. Managers draft; company admins send. Each message ends
 * with the company's number for opting out, and goes out after every operational SMS, 08:00-19:00,
 * within the daily SMS limit.
 */
export function PromotionsClient({
  initialPromotions,
  initialOptOuts,
  loadError,
  canDraft,
  canSend,
  canRemoveOptOut,
}: {
  initialPromotions: Promotion[] | null;
  initialOptOuts: PromotionOptOut[] | null;
  loadError?: string;
  canDraft: boolean;
  canSend: boolean;
  canRemoveOptOut: boolean;
}) {
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions ?? []);
  const [optOuts, setOptOuts] = useState<PromotionOptOut[]>(initialOptOuts ?? []);

  const reloadPromotions = useCallback(async () => {
    const res = await getPromotions();
    if (res.data) setPromotions(res.data);
  }, []);
  async function reloadOptOuts() {
    const res = await getOptOuts();
    if (res.data) setOptOuts(res.data);
  }

  // progress of promotions that are still going out
  const sending = promotions.some((p) => p.status === "QUEUED" && p.queued > 0);
  useEffect(() => (sending ? visibleInterval(reloadPromotions, 30_000) : undefined), [sending, reloadPromotions]);

  return (
    <div className="space-y-6">
      {loadError && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">{loadError}</p>
      )}
      {canDraft && <Compose canSend={canSend} onChanged={reloadPromotions} />}
      <PromotionList promotions={promotions} canSend={canSend} onChanged={reloadPromotions} />
      <OptOuts optOuts={optOuts} canRemove={canRemoveOptOut}
        onChanged={() => { void reloadOptOuts(); void reloadPromotions(); }} />
    </div>
  );
}

function Compose({ canSend, onChanged }: { canSend: boolean; onChanged: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [draftId, setDraftId] = useState<number | null>(null);
  const [preview, setPreview] = useState<PromotionPreview | null>(null);
  const [busy, setBusy] = useState<"" | "preview" | "save" | "send">("");
  const [confirming, setConfirming] = useState(false);

  const ready = name.trim().length > 0 && message.trim().length > 0 && message.length <= MAX_MESSAGE;

  async function runPreview() {
    setBusy("preview");
    try {
      const res = await previewPromotion(message);
      if (res.data) setPreview(res.data); else toast.error(res.error);
    } finally {
      setBusy("");
    }
  }

  async function save(): Promise<number | null> {
    setBusy("save");
    try {
      const res = await saveDraft(name, message, draftId ?? undefined);
      if (!res.data) {
        toast.error(res.error);
        return null;
      }
      setDraftId(res.data.id);
      await onChanged();
      return res.data.id;
    } finally {
      setBusy("");
    }
  }

  async function send() {
    setConfirming(false);
    const id = await save();
    if (id == null) return;
    setBusy("send");
    try {
      const res = await sendPromotion(id);
      if (res.data) {
        toast.success(`Queued for ${res.data.recipients ?? 0} people`);
        setName(""); setMessage(""); setDraftId(null); setPreview(null);
        await onChanged();
      } else {
        toast.error(res.error);
      }
    } finally {
      setBusy("");
    }
  }

  return (
    <section aria-labelledby="new-promotion" className="rounded-2xl border border-border bg-card shadow-xl">
      <div className="border-b border-border p-6">
        <h2 id="new-promotion" className="flex items-center gap-2 text-lg font-normal">
          <Megaphone className="h-4 w-4 text-primary" /> New promotion
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Goes to every customer and every number that has bought hotspot access, except those who opted out.
          The opt-out line is added for you. Promotions go out after all other SMS, between 8 am and 7 pm, within
          the company&apos;s daily SMS limit, so a large one can take more than a day.
        </p>
      </div>
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="promo-name">Name (for your records)</Label>
            <Input id="promo-name" value={name} maxLength={120} onChange={(e) => setName(e.target.value)}
              placeholder="Weekend offer, 24 Oct" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="promo-message">Message</Label>
            <textarea id="promo-message" value={message} rows={5} maxLength={MAX_MESSAGE}
              onChange={(e) => { setMessage(e.target.value); setPreview(null); }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Get 20% more time on every hotspot package this weekend." />
            <p className="text-xs text-muted-foreground tabular-nums">{message.length} / {MAX_MESSAGE}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" disabled={!message.trim() || busy !== ""} onClick={() => void runPreview()}>
              {busy === "preview" ? "Counting…" : "Preview"}
            </Button>
            <Button variant="secondary" size="sm" disabled={!ready || busy !== ""} onClick={() => void save()}>
              {busy === "save" ? "Saving…" : draftId ? "Save changes" : "Save draft"}
            </Button>
            {canSend && (
              <Button size="sm" disabled={!ready || !preview || busy !== "" || preview.problem?.startsWith("The company has no")}
                onClick={() => setConfirming(true)}>
                <Send className="h-4 w-4" /> {busy === "send" ? "Sending…" : "Send"}
              </Button>
            )}
          </div>
          {canSend && !preview && ready && <p className="text-xs text-muted-foreground">Preview first to see who will receive it.</p>}
          {!canSend && <p className="text-xs text-muted-foreground">Save it as a draft; a company admin sends it.</p>}
        </div>
        <PreviewCard preview={preview} />
      </div>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send this promotion to {preview?.recipients ?? 0} people?</AlertDialogTitle>
            <AlertDialogDescription>
              {preview?.totalSms ?? 0} SMS{preview?.estimatedCost != null ? `, about KSh ${preview.estimatedCost}` : ""}.
              It cannot be unsent; you can cancel what has not gone out yet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not now</AlertDialogCancel>
            <AlertDialogAction onClick={() => void send()}>Send</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function PreviewCard({ preview }: { preview: PromotionPreview | null }) {
  if (!preview) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        Press Preview to see the message as customers will get it, how many people will receive it and how many SMS
        that is.
      </div>
    );
  }
  return (
    <div className="space-y-3 rounded-xl border border-border p-4 text-sm">
      <div className="whitespace-pre-wrap rounded-lg bg-muted p-3 font-mono text-xs">{preview.fullText}</div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
        <dt className="text-muted-foreground">Recipients</dt><dd className="tabular-nums">{preview.recipients}</dd>
        <dt className="text-muted-foreground">Opted out (left out)</dt><dd className="tabular-nums">{preview.optedOut}</dd>
        <dt className="text-muted-foreground">SMS each</dt><dd className="tabular-nums">{preview.smsPerRecipient} ({preview.characters} characters)</dd>
        <dt className="text-muted-foreground">SMS in total</dt><dd className="tabular-nums">{preview.totalSms}</dd>
        {preview.estimatedCost != null && (<><dt className="text-muted-foreground">Cost, about</dt><dd className="tabular-nums">KSh {preview.estimatedCost}</dd></>)}
        {preview.promotionsPerDay != null && (<><dt className="text-muted-foreground">Promotions per day</dt><dd className="tabular-nums">up to {preview.promotionsPerDay}</dd></>)}
        {preview.daysNeeded != null && (<><dt className="text-muted-foreground">Takes</dt><dd className="tabular-nums">{preview.daysNeeded} day{preview.daysNeeded === 1 ? "" : "s"}</dd></>)}
        <dt className="text-muted-foreground">Sending hours</dt><dd className="tabular-nums">{preview.sendingHours}</dd>
      </dl>
      {preview.problem && <p role="alert" className="text-amber-700 dark:text-amber-400">{preview.problem}</p>}
    </div>
  );
}

function PromotionList({ promotions, canSend, onChanged }: { promotions: Promotion[]; canSend: boolean; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState<number | null>(null);

  async function cancel(id: number) {
    setBusy(id);
    try {
      const res = await cancelPromotion(id);
      if (res.data) toast.success("Cancelled; nothing more of it will be sent."); else toast.error(res.error);
      await onChanged();
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="promotion-list" className="rounded-2xl border border-border bg-card shadow-xl">
      <h2 id="promotion-list" className="border-b border-border p-6 text-lg font-normal">Promotions</h2>
      {promotions.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">No promotions yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Promotion</th><th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sent</th><th className="px-4 py-3">Waiting</th>
                <th className="px-4 py-3">Failed / expired</th><th className="px-4 py-3">By</th>
                {canSend && <th className="px-4 py-3"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody>
              {promotions.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="max-w-sm px-4 py-3">
                    <p className="font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground" title={p.message}>{p.message}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(p.status === "CANCELLED" && "text-muted-foreground",
                      p.status === "QUEUED" && "text-emerald-600 dark:text-emerald-400")}>
                      {p.status === "DRAFT" ? "Draft" : p.status === "CANCELLED" ? "Cancelled"
                        : p.queued > 0 ? "Sending" : "Done"}
                    </span>
                    {p.recipients != null && <p className="text-xs text-muted-foreground tabular-nums">{p.recipients} people</p>}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{p.sent}</td>
                  <td className="px-4 py-3 tabular-nums">{p.queued}</td>
                  <td className="px-4 py-3 tabular-nums">{p.failed} / {p.expired}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {p.queuedBy ? `sent by ${p.queuedBy}` : `drafted by ${p.createdBy ?? "?"}`}
                  </td>
                  {canSend && (
                    <td className="px-4 py-3 text-right">
                      {(p.status === "DRAFT" || (p.status === "QUEUED" && p.queued > 0)) && (
                        <Button variant="ghost" size="sm" disabled={busy === p.id} onClick={() => void cancel(p.id)}>
                          <X className="h-4 w-4" /> {p.status === "DRAFT" ? "Discard" : "Cancel the rest"}
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function OptOuts({ optOuts, canRemove, onChanged }: { optOuts: PromotionOptOut[]; canRemove: boolean; onChanged: () => void }) {
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<OptOutChannel>("CALL");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    try {
      const res = await addOptOut(phone, channel, note);
      if (res.data) {
        toast.success(res.data.withdrawn > 0
          ? `Recorded; ${res.data.withdrawn} waiting promotion${res.data.withdrawn === 1 ? "" : "s"} withdrawn.`
          : "Recorded; this number will get no more promotions.");
        setPhone(""); setNote("");
        onChanged();
      } else {
        toast.error(res.error);
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    const res = await removeOptOut(id);
    if (res.success) onChanged(); else toast.error(res.error);
  }

  return (
    <section aria-labelledby="opt-outs" className="rounded-2xl border border-border bg-card shadow-xl">
      <div className="border-b border-border p-6">
        <h2 id="opt-outs" className="flex items-center gap-2 text-lg font-normal">
          <UserX className="h-4 w-4 text-primary" /> Opted out
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          When a customer calls or writes to stop promotions, record the number here. They will get no more
          promotions, including any still waiting to go out. Payment confirmations and other service messages
          still reach them.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3 border-b border-border p-6">
        <div className="space-y-1.5">
          <Label htmlFor="optout-phone">Phone number</Label>
          <Input id="optout-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" className="w-44" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="optout-channel">How they asked</Label>
          <select id="optout-channel" value={channel} onChange={(e) => setChannel(e.target.value as OptOutChannel)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="min-w-[200px] flex-1 space-y-1.5">
          <Label htmlFor="optout-note">Note (optional)</Label>
          <Input id="optout-note" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
        </div>
        <Button size="sm" disabled={!phone.trim() || busy} onClick={() => void add()}>{busy ? "Saving…" : "Record opt-out"}</Button>
      </div>
      {optOuts.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">Nobody has opted out.</p>
      ) : (
        <ul className="divide-y divide-border">
          {optOuts.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-3 text-sm">
              <span className="w-32 font-medium tabular-nums">0{o.phone.slice(3)}</span>
              <span className="w-24 text-muted-foreground">{CHANNELS.find((c) => c.value === o.channel)?.label ?? o.channel}</span>
              <span className="flex-1 text-muted-foreground">{o.note}</span>
              <span className="text-xs text-muted-foreground">{o.createdBy} · {new Date(o.createdAt).toLocaleDateString()}</span>
              {canRemove && (
                <Button variant="ghost" size="sm" onClick={() => void remove(o.id)} aria-label={`Remove opt-out for 0${o.phone.slice(3)}`}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
