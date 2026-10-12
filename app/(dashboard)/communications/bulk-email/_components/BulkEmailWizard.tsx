"use client";

import { useState } from "react";
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
import { sendBulkEmailAction } from "@/actions/communications";
import type { CampaignRecipient, EmailTemplate } from "../page";
import {
  bulkEmailSchema,
  BULK_EMAIL_INITIAL_VALUES,
  type BulkEmailValues,
  type NotificationChannel,
  type AudienceSource,
} from "@/lib/validation/bulk-email";

interface Props {
 customers: CampaignRecipient[];
 systemUsers: CampaignRecipient[];
 templates: EmailTemplate[];
 templateNotice?: string;
 templateRequestId?: string;
 recipientError?: string;
 recipientRequestId?: string;
}

type Recipient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  recipientType: "CUSTOMER" | "SYSTEM_USER";
};

function campaignToRecipient(c: CampaignRecipient): Recipient {
  return {
    id: String(c.id),
    name: c.name,
    email: c.email ?? "",
    phone: c.phoneNumber ?? "",
    recipientType: c.recipientType,
  };
}

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
              <p className="text-xs font-medium text-foreground">SpeedLink</p>
              <p className="text-[11px] text-muted-foreground">noreply@beesmart.co.ke</p>
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
          Variables like <code className="font-mono bg-warning/15 px-1 rounded">{"{{customer_name}}"}</code> will be replaced with each recipient&apos;s actual details before sending.
        </p>
      </div>
    </div>
  );
}

export default function BulkEmailWizard({
  templates,
  customers,
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

  // Declared before useFormik so onSubmit can resolve the selected ids to the
  // backend payload shape ({ recipientType, recipientId: number }).
  const customerRecipients = customers.map(campaignToRecipient);
  const userRecipients = systemUsers.map(campaignToRecipient);

  const formik = useFormik<BulkEmailValues>({
    initialValues: BULK_EMAIL_INITIAL_VALUES,
    validationSchema: bulkEmailSchema,
    onSubmit: async (values, helpers) => {
      const recipients = [...customerRecipients, ...userRecipients]
        .filter((r) => values.recipientIds.includes(r.id))
        .map((r) => ({ recipientType: r.recipientType, recipientId: Number(r.id) }))
        .filter((r) => Number.isFinite(r.recipientId));

      setSendError(null);
      setSendRequestId(null);

      const result = await sendBulkEmailAction({
        recipients,
        templateId: values.templateId,
        subject: values.subject,
        body: values.body,
      });
      if (result.success) {
        setSent(true);
      } else {
        setSendError(result.message);
        setSendRequestId(result.requestId ?? null);
        toast.error("Failed to send campaign", { description: result.message });
      }
      helpers.setSubmitting(false);
    },
  });

  const { values, errors, touched } = formik;

  // `source` only filters which list is shown; a campaign may target customers
  // AND system users at once, so selections are tracked across both pools and
  // the send payload resolves ids against the union.
  const allRecipients = [...customerRecipients, ...userRecipients];
  const sourceRecipients = values.source === "customers" ? customerRecipients : userRecipients;
  const selectedRecipients = allRecipients.filter((r) => values.recipientIds.includes(r.id));
  const audienceLabel = values.source === "customers" ? "Customers" : "System Users";

  const visibleRecipients = sourceRecipients.filter(
    (r) => !search.trim() || r.name.toLowerCase().includes(search.trim().toLowerCase())
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
    const stillReachable = sourceRecipients
      .filter((r) => hasContactForChannel(r, channel))
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
          <strong>{values.recipientIds.length.toLocaleString()} recipients</strong> in{" "}
          <strong>{audienceLabel}</strong>.
        </p>
        <Button onClick={startNewCampaign}>Send Another Campaign</Button>
      </div>
    );
  }

  return (
    <form onSubmit={formik.handleSubmit} className="w-full max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-normal text-foreground">Bulk Email</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Reach customers at scale — renewals, promos, and notices in a few clicks
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

 {recipientError && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">Customer recipients unavailable: {recipientError}{recipientRequestId ? ` · Ref: ${recipientRequestId}` : ""}</p>}
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
                  Choose a channel, then select recipients individually from customers or system users.
                </p>
              </div>

              <ToggleGroup options={CHANNEL_OPTIONS} value={values.channel} onChange={handleChannelChange} />

              <Separator />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <ToggleGroup options={SOURCE_OPTIONS} value={values.source} onChange={handleSourceChange} size="sm" />
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name"
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
              Send Campaign
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
