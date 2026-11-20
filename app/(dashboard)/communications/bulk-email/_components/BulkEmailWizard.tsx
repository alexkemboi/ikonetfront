"use client";

import { useEffect, useState } from "react";
import { useFormik } from "formik";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserCog,
  Mail,
  MessageSquare,
  Eye,
  Send,
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  FileText,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAudiencePeople,
  sendBulkEmailAction,
  sendSmsNoticeAction,
  type AudienceListing,
  type AudiencePerson,
  type AudienceScope,
  type AudienceTree,
} from "@/actions/communications";
import { AudienceFilter } from "@/components/communications/AudienceFilter";
import { EMPTY_SCOPE, KIND_LABEL, describeScope } from "@/lib/communications/audience";
import type { CampaignRecipient, EmailTemplate } from "../page";
import {
  bulkEmailSchema,
  BULK_EMAIL_INITIAL_VALUES,
  type BulkEmailValues,
  type NotificationChannel,
  type AudienceSource,
} from "@/lib/validation/bulk-email";

interface Props {
 /** The company's regions, locations, stations and MikroTiks; null when they could not be read. */
 tree: AudienceTree | null;
 systemUsers: CampaignRecipient[];
 templates: EmailTemplate[];
 templateNotice?: string;
 templateRequestId?: string;
 recipientError?: string;
 recipientRequestId?: string;
}

/**
 * One person on the list. `id` is the key sent to the server: U:<account> and P:<number>
 * for customers (from the network filter), S:<account> for system users.
 */
type Recipient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  recipientType: "CUSTOMER" | "SYSTEM_USER";
  /** Where they are, e.g. "WESTGATE · ADRINOLD-WESTLANDS · PPPoE subscribers". */
  detail?: string;
};

function staffToRecipient(c: CampaignRecipient): Recipient {
  return {
    id: `S:${c.id}`,
    name: c.name,
    email: c.email ?? "",
    phone: c.phoneNumber ?? "",
    recipientType: "SYSTEM_USER",
  };
}

function personToRecipient(p: AudiencePerson): Recipient {
  return {
    id: p.key,
    name: p.name || (p.phone ? `+${p.phone}` : "Customer"),
    email: p.email ?? "",
    phone: p.phone ?? "",
    recipientType: "CUSTOMER",
    detail: [p.stationName ?? "No station", p.deviceName, KIND_LABEL[p.kind]].filter(Boolean).join(" · "),
  };
}

const isCustomerKey = (id: string) => id.startsWith("U:") || id.startsWith("P:");

function hasContactForChannel(recipient: Recipient, channel: NotificationChannel): boolean {
  return channel === "EMAIL" ? !!recipient.email : !!recipient.phone;
}

const STEPS = [
  { id: 1, label: "Audience", icon: Users },
  { id: 2, label: "Compose", icon: Mail },
  { id: 3, label: "Preview", icon: Eye },
  { id: 4, label: "Send", icon: Send },
];

const CHANNEL_OPTIONS: { id: NotificationChannel; label: string; icon: React.ElementType }[] = [
  { id: "EMAIL", label: "Email", icon: Mail },
  { id: "SMS", label: "SMS", icon: MessageSquare },
];

const SOURCE_OPTIONS: { id: AudienceSource; label: string; icon: React.ElementType }[] = [
  { id: "customers", label: "Customers", icon: Users },
  { id: "users", label: "System Users", icon: UserCog },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((step, i) => {
        const done = current > step.id;
        const active = current === step.id;
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                  done
                    ? "bg-primary border-primary text-primary-foreground"
                    : active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-secondary bg-secondary text-secondary-foreground"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-[11px] font-medium whitespace-nowrap ${
                  active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-16 h-0.5 mb-4 mx-1 transition-colors ${
                  current > step.id ? "bg-primary" : "bg-secondary"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  size = "default",
}: {
  options: { id: T; label: string; icon: React.ElementType }[];
  value: T;
  onChange: (id: T) => void;
  size?: "default" | "sm";
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const Icon = opt.icon;
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border font-medium transition-all",
              size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm",
              selected
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:bg-muted/50"
            )}
          >
            <Icon className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function RecipientRow({
  recipient,
  channel,
  selected,
  onToggle,
}: {
  recipient: Recipient;
  channel: NotificationChannel;
  selected: boolean;
  onToggle: () => void;
}) {
  const contact = channel === "EMAIL" ? recipient.email : recipient.phone;
  const reachable = !!contact;
  return (
    <label
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 transition-colors",
        reachable ? "cursor-pointer hover:bg-muted/40" : "opacity-50 cursor-not-allowed"
      )}
    >
      <Checkbox checked={selected} disabled={!reachable} onCheckedChange={onToggle} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{recipient.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {reachable ? contact : `No ${channel === "EMAIL" ? "email" : "phone number"} on file`}
          {recipient.detail ? ` · ${recipient.detail}` : ""}
        </p>
      </div>
    </label>
  );
}

function EmailPreview({
  subject,
  body,
  recipientCount,
  audienceLabel,
}: {
  subject: string;
  body: string;
  recipientCount: number;
  audienceLabel: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">To:</span>
          <Badge variant="outline" className="text-xs">
            {audienceLabel}
          </Badge>
          <span className="text-muted-foreground text-xs">
            ({recipientCount.toLocaleString()} recipients)
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-white">
        <div className="px-5 py-4 border-b border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">Subject</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">
            {subject || <em className="text-muted-foreground font-normal">(no subject)</em>}
          </p>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
              I
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">Your company</p>
              <p className="text-[11px] text-muted-foreground">Sent under the company&apos;s sender settings</p>
            </div>
          </div>
          <pre className="text-sm text-foreground font-sans whitespace-pre-wrap leading-relaxed">
            {body || <span className="text-muted-foreground italic">(no message body)</span>}
          </pre>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
        <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-warning">
          Variables like <code className="font-mono bg-warning/15 px-1 rounded">{"{{customer_name}}"}</code> will be replaced with each recipient&apos;s actual details before sending.
        </p>
      </div>
    </div>
  );
}

function SmsPreview({ body, recipientCount, audienceLabel }: { body: string; recipientCount: number; audienceLabel: string }) {
  const segments = body.length === 0 ? 0 : Math.ceil(body.length / 160);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">To:</span>
          <Badge variant="outline" className="text-xs">
            {audienceLabel}
          </Badge>
          <span className="text-muted-foreground text-xs">
            ({recipientCount.toLocaleString()} recipients)
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-5">
        <div className="max-w-xs ml-auto rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed">
          {body || <span className="italic opacity-70">(no message body)</span>}
        </div>
        <p className="text-[11px] text-muted-foreground text-right mt-2">
          {body.length} characters · {segments} SMS segment{segments === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
        <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-warning">
          An SMS goes out exactly as written: placeholders such as {"{{customer_name}}"} are not filled in. It is sent
          straight away, within the company&apos;s daily SMS limit, and reaches numbers that opted out of promotions.
        </p>
      </div>
    </div>
  );
}

export default function BulkEmailWizard({
  templates,
  tree,
  systemUsers,
  templateNotice,
  templateRequestId,
  recipientError,
  recipientRequestId,
}: Props) {
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(false);
  const [search, setSearch] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendRequestId, setSendRequestId] = useState<string | null>(null);
  const [sentCount, setSentCount] = useState(0);
  const [scope, setScope] = useState<AudienceScope>(EMPTY_SCOPE);
  const [listing, setListing] = useState<AudienceListing | null>(null);
  const [listingError, setListingError] = useState<string | null>(null);
  // the scope the list on screen belongs to; while it differs from `scope` a new list is loading
  const [loadedScope, setLoadedScope] = useState<AudienceScope | null>(null);
  const loadingPeople = loadedScope !== scope;

  // Customers come from the network filter; system users from the account list.
  const customerRecipients = (listing?.people ?? []).map(personToRecipient);
  const userRecipients = systemUsers.map(staffToRecipient);

  const formik = useFormik<BulkEmailValues>({
    initialValues: BULK_EMAIL_INITIAL_VALUES,
    validationSchema: bulkEmailSchema,
    onSubmit: async (values, helpers) => {
      setSendError(null);
      setSendRequestId(null);

      let result: { success: boolean; message?: string; requestId?: string };
      if (values.channel === "SMS") {
        // only customers of the chosen part of the network; the server checks them again
        const keys = values.recipientIds.filter(isCustomerKey);
        const sms = await sendSmsNoticeAction({ scope, keys, message: values.body });
        result = sms;
        if (sms.success) setSentCount(sms.data?.recipients ?? keys.length);
      } else {
        const recipients = values.recipientIds
          .filter((id) => id.startsWith("U:") || id.startsWith("S:"))
          .map((id) => ({
            recipientType: (id.startsWith("S:") ? "SYSTEM_USER" : "CUSTOMER") as "SYSTEM_USER" | "CUSTOMER",
            recipientId: Number(id.slice(2)),
          }))
          .filter((r) => Number.isFinite(r.recipientId));
        result = await sendBulkEmailAction({
          recipients,
          templateId: values.templateId,
          subject: values.subject,
          body: values.body,
        });
        if (result.success) setSentCount(recipients.length);
      }
      if (result.success) {
        setSent(true);
      } else {
        setSendError(result.message ?? "The message could not be sent.");
        setSendRequestId(result.requestId ?? null);
        toast.error("Failed to send campaign", { description: result.message });
      }
      helpers.setSubmitting(false);
    },
  });

  const { values, errors, touched } = formik;

  // The list follows the filter. A new filter starts a new customer selection, so what is sent
  // is always what the filter shows.
  useEffect(() => {
    if (!tree) return;
    let cancelled = false;
    getAudiencePeople(scope).then((res) => {
      if (cancelled) return;
      setListing(res.data);
      setListingError(res.data ? null : res.message ?? "The customers could not be loaded.");
      setLoadedScope(scope);
    });
    return () => {
      cancelled = true;
    };
  }, [scope, tree]);

  function changeScope(next: AudienceScope) {
    setScope(next);
    formik.setFieldValue("recipientIds", values.recipientIds.filter((id) => !isCustomerKey(id)));
  }

  // `source` only filters which list is shown; a campaign may target customers
  // AND system users at once, so selections are tracked across both pools and
  // the send payload resolves ids against the union.
  const allRecipients = [...customerRecipients, ...userRecipients];
  const sourceRecipients = values.source === "customers" ? customerRecipients : userRecipients;
  const selectedRecipients = allRecipients.filter((r) => values.recipientIds.includes(r.id));
  const audienceLabel = values.source === "customers" ? describeScope(tree, scope) : "System Users";

  // "0712..." finds 254712...
  const searchDigits = search.replace(/\D/g, "").replace(/^0/, "");
  const visibleRecipients = sourceRecipients.filter(
    (r) => !search.trim() || r.name.toLowerCase().includes(search.trim().toLowerCase())
      || (searchDigits.length >= 3 && r.phone.includes(searchDigits))
  );
  const reachableVisibleIds = visibleRecipients
    .filter((r) => hasContactForChannel(r, values.channel))
    .map((r) => r.id);
  const allVisibleSelected =
    reachableVisibleIds.length > 0 && reachableVisibleIds.every((id) => values.recipientIds.includes(id));

  const step1Valid = values.recipientIds.length > 0;
  const step2Valid =
    values.channel === "EMAIL"
      ? !!values.subject.trim() && !!values.body.trim()
      : !!values.body.trim();

  function applyTemplate(templateId: string) {
    const tpl = templates.find((t) => t.id === templateId);
    formik.setFieldValue("templateId", templateId);
    formik.setFieldValue("subject", tpl?.subject ?? "");
    formik.setFieldValue("body", tpl?.body ?? "");
  }

  function handleChannelChange(channel: NotificationChannel) {
    formik.setFieldValue("channel", channel);
    // SMS goes to customers only: staff are texted through their own alerts
    if (channel === "SMS") formik.setFieldValue("source", "customers");
    const stillReachable = allRecipients
      .filter((r) => hasContactForChannel(r, channel) && (channel === "EMAIL" || r.recipientType === "CUSTOMER"))
      .map((r) => r.id);
    formik.setFieldValue(
      "recipientIds",
      values.recipientIds.filter((id) => stillReachable.includes(id))
    );
  }

  function handleSourceChange(source: AudienceSource) {
    // Switching the list must not drop recipients already picked from the other.
    formik.setFieldValue("source", source);
    setSearch("");
  }

  function toggleRecipient(id: string) {
    const next = values.recipientIds.includes(id)
      ? values.recipientIds.filter((r) => r !== id)
      : [...values.recipientIds, id];
    formik.setFieldValue("recipientIds", next);
  }

  function toggleSelectAllVisible() {
    formik.setFieldValue(
      "recipientIds",
      allVisibleSelected
        ? values.recipientIds.filter((id) => !reachableVisibleIds.includes(id))
        : Array.from(new Set([...values.recipientIds, ...reachableVisibleIds]))
    );
  }

  function goBack() {
    setStep((s) => s - 1);
  }

  function goNext() {
    if (step === 1 && !step1Valid) {
      formik.setFieldTouched("recipientIds", true);
      return;
    }
    if (step === 2 && !step2Valid) {
      formik.setFieldTouched("subject", true);
      formik.setFieldTouched("body", true);
      return;
    }
    setStep((s) => s + 1);
  }

  function startNewCampaign() {
    setSent(false);
    setStep(1);
    setSearch("");
    formik.resetForm();
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-2xl font-normal text-foreground">Campaign Sent!</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Your {values.channel === "EMAIL" ? "email" : "SMS"} has been queued for delivery to{" "}
          <strong>{sentCount.toLocaleString()} recipient{sentCount === 1 ? "" : "s"}</strong>.
        </p>
        <Button onClick={startNewCampaign}>Send another message</Button>
      </div>
    );
  }

  return (
    <form onSubmit={formik.handleSubmit} className="w-full max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-normal text-foreground">SMS &amp; Emails</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Message the customers of a region, location, station or MikroTik, or the whole company
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

 {(recipientError || listingError) && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">Customer recipients unavailable: {listingError ?? recipientError}{recipientRequestId ? ` · Ref: ${recipientRequestId}` : ""}</p>}
 {templateNotice && step === 2 && <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">Using built-in templates. {templateNotice}{templateRequestId ? ` · Ref: ${templateRequestId}` : ""}</p>}
 {sendError && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">{sendError}{sendRequestId ? ` · Ref: ${sendRequestId}` : ""}</p>}

      {/* Step content */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-8">
          {/* ── Step 1: Audience ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-normal text-foreground">How should we reach them?</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose a channel, narrow the customers to a part of the network, then select who gets it.
                </p>
              </div>

              <ToggleGroup options={CHANNEL_OPTIONS} value={values.channel} onChange={handleChannelChange} />

              <Separator />

              {values.source === "customers" && tree && (
                <AudienceFilter tree={tree} scope={scope} onChange={changeScope} disabled={formik.isSubmitting} />
              )}
              {values.source === "customers" && listing && (
                <p className="text-xs text-muted-foreground" role="status">
                  {loadingPeople ? "Loading…" : (
                    <>
                      {listing.total.toLocaleString()} customer{listing.total === 1 ? "" : "s"} here:{" "}
                      {listing.withPhone.toLocaleString()} with a mobile number, {listing.withEmail.toLocaleString()} with an email.
                      {listing.truncated ? ` The first ${listing.people.length.toLocaleString()} are listed; narrow the filter to see the rest.` : ""}
                    </>
                  )}
                </p>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {values.channel === "EMAIL" ? (
                  <ToggleGroup options={SOURCE_OPTIONS} value={values.source} onChange={handleSourceChange} size="sm" />
                ) : (
                  <span className="text-xs text-muted-foreground">SMS goes to customers. Staff get theirs through My alerts.</span>
                )}
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or number"
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border">
                  <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                    <Checkbox
                      checked={allVisibleSelected}
                      disabled={reachableVisibleIds.length === 0}
                      onCheckedChange={toggleSelectAllVisible}
                    />
                    Select all visible
                  </label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {values.recipientIds.length.toLocaleString()} selected
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  {visibleRecipients.length === 0 ? (
                    <p className="px-4 py-6 text-xs text-muted-foreground text-center">
                      No {audienceLabel.toLowerCase()} found.
                    </p>
                  ) : (
                    visibleRecipients.map((r) => (
                      <RecipientRow
                        key={r.id}
                        recipient={r}
                        channel={values.channel}
                        selected={values.recipientIds.includes(r.id)}
                        onToggle={() => toggleRecipient(r.id)}
                      />
                    ))
                  )}
                </div>
              </div>

              {touched.recipientIds && errors.recipientIds && (
                <p className="text-xs text-danger">{errors.recipientIds as string}</p>
              )}
            </div>
          )}

          {/* ── Step 2: Compose ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-normal text-foreground">
                  Compose your {values.channel === "EMAIL" ? "email" : "SMS"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Start from a template or write your own. Use{" "}
                  <code className="font-mono bg-muted px-1 rounded text-[11px]">{"{{customer_name}}"}</code>{" "}
                  as a placeholder — it gets replaced automatically.
                </p>
              </div>

              {/* Template picker */}
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <Select value={values.templateId} onValueChange={applyTemplate}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                                      <SelectItem value="blank">Write from scratch</SelectItem>
 {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Subject — email only */}
              {values.channel === "EMAIL" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Subject line
                  </label>
                  <Input
                    placeholder="e.g. Your subscription is expiring soon"
                    className={cn("h-10", touched.subject && errors.subject && "border-danger")}
                    {...formik.getFieldProps("subject")}
                  />
                  {touched.subject && errors.subject && (
                    <p className="text-xs text-danger">{errors.subject}</p>
                  )}
                </div>
              )}

              {/* Body */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  Message body
                </label>
                <textarea
                  rows={values.channel === "EMAIL" ? 12 : 6}
                  placeholder="Write your message here..."
                  className={cn(
                    "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-sans tabular-nums resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground",
                    touched.body && errors.body && "border-danger"
                  )}
                  {...formik.getFieldProps("body")}
                />
                <div className="flex items-center justify-between">
                  {touched.body && errors.body ? (
                    <p className="text-xs text-danger">{errors.body}</p>
                  ) : (
                    <span />
                  )}
                  <p className="text-[11px] text-muted-foreground text-right">
                    {values.channel === "SMS"
                      ? `${values.body.length} characters · ${values.body.length === 0 ? 0 : Math.ceil(values.body.length / 160)} SMS segment${Math.ceil(values.body.length / 160) === 1 ? "" : "s"}`
                      : `${values.body.length} characters`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Preview ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-normal text-foreground">Review before sending</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This is how your {values.channel === "EMAIL" ? "email" : "SMS"} will appear. Check the message and recipient count carefully.
                </p>
              </div>
              {values.channel === "EMAIL" ? (
                <EmailPreview
                  subject={values.subject}
                  body={values.body}
                  recipientCount={selectedRecipients.length}
                  audienceLabel={audienceLabel}
                />
              ) : (
                <SmsPreview
                  body={values.body}
                  recipientCount={selectedRecipients.length}
                  audienceLabel={audienceLabel}
                />
              )}
            </div>
          )}

          {/* ── Step 4: Confirm ── */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-normal text-foreground">Ready to send?</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Double-check the summary below. Once sent, this cannot be undone.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Channel", value: values.channel === "EMAIL" ? "Email" : "SMS" },
                  { label: "Audience", value: `${values.recipientIds.length.toLocaleString()} ${audienceLabel}` },
                  ...(values.channel === "EMAIL"
                    ? [{ label: "Subject", value: values.subject || "(no subject)" }]
                    : []),
                  { label: "Body length", value: `${values.body.length} characters` },
                  { label: "Template", value: templates.find((t) => t.id === values.templateId)?.name ?? "Custom" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-4 py-2.5 border-b border-border last:border-0">
                    <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
                    <span className="text-sm text-foreground font-medium text-right">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-danger/10 border border-danger/30">
                <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <p className="text-xs text-danger">
                  Sending to <strong>{values.recipientIds.length.toLocaleString()}</strong> recipients is irreversible. Ensure your message is accurate and professional before proceeding.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          disabled={step === 1}
          className="gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {step < 4 ? (
            <Button
              type="button"
              onClick={goNext}
              disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
              className="gap-1.5"
            >
              {step === 3 ? "Confirm & Review" : "Continue"}
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={formik.isSubmitting || !step2Valid}
              className="gap-2"
            >
              {formik.isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {values.channel === "SMS" ? "Send SMS" : "Send email"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
