"use client";

import { useState } from "react";
import { useFormik } from "formik";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Wifi,
  Radio,
  Clock,
  Bell,
  UserX,
  Mail,
  Eye,
  Send,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  FileText,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AudienceSegment, EmailTemplate } from "@/actions/communications";
import { sendBulkEmailAction } from "@/actions/communications";
import { bulkEmailSchema, BULK_EMAIL_INITIAL_VALUES, type BulkEmailValues } from "@/lib/validation/bulk-email";

interface Props {
  segments: AudienceSegment[];
  templates: EmailTemplate[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  users: Users,
  wifi: Wifi,
  radio: Radio,
  clock: Clock,
  bell: Bell,
  "user-x": UserX,
};

const STEPS = [
  { id: 1, label: "Audience", icon: Users },
  { id: 2, label: "Compose", icon: Mail },
  { id: 3, label: "Preview", icon: Eye },
  { id: 4, label: "Send", icon: Send },
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
                    : "border-border bg-card text-muted-foreground"
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
                  current > step.id ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SegmentCard({
  segment,
  selected,
  onSelect,
}: {
  segment: AudienceSegment;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = ICON_MAP[segment.icon] ?? Users;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-sm ${
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-foreground">
              {segment.label}
            </span>
            <span
              className={`text-sm font-bold tabular-nums ${
                selected ? "text-primary" : "text-foreground"
              }`}
            >
              {segment.count.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {segment.description}
          </p>
        </div>
      </div>
    </button>
  );
}

function EmailPreview({
  subject,
  body,
  recipientCount,
  segmentLabel,
}: {
  subject: string;
  body: string;
  recipientCount: number;
  segmentLabel: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">To:</span>
          <Badge variant="outline" className="text-xs">
            {segmentLabel}
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
              B
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">Beesmart Internet</p>
              <p className="text-[11px] text-muted-foreground">noreply@beesmart.co.ke</p>
            </div>
          </div>
          <pre className="text-sm text-foreground font-sans whitespace-pre-wrap leading-relaxed">
            {body || <span className="text-muted-foreground italic">(no message body)</span>}
          </pre>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-[oklch(0.97_0.04_65)] border border-[oklch(0.86_0.1_65)]">
        <AlertCircle className="w-4 h-4 text-[oklch(0.65_0.18_65)] shrink-0 mt-0.5" />
        <p className="text-xs text-[oklch(0.5_0.18_65)]">
          Variables like <code className="font-mono bg-[oklch(0.93_0.04_65)] px-1 rounded">{"{{customer_name}}"}</code> will be replaced with each recipient&apos;s actual details before sending.
        </p>
      </div>
    </div>
  );
}

export default function BulkEmailWizard({ segments, templates }: Props) {
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(false);

  const formik = useFormik<BulkEmailValues>({
    initialValues: BULK_EMAIL_INITIAL_VALUES,
    validationSchema: bulkEmailSchema,
    onSubmit: async (values, helpers) => {
      const result = await sendBulkEmailAction(values);
      if (result.success) {
        setSent(true);
      } else {
        toast.error("Failed to send campaign", { description: result.message });
      }
      helpers.setSubmitting(false);
    },
  });

  const { values, errors, touched } = formik;
  const selectedSegment = segments.find((s) => s.id === values.segmentId);
  const step1Valid = !!values.segmentId;
  const step2Valid = !!values.subject.trim() && !!values.body.trim();

  function applyTemplate(templateId: string) {
    const tpl = templates.find((t) => t.id === templateId);
    formik.setFieldValue("templateId", templateId);
    formik.setFieldValue("subject", tpl?.subject ?? "");
    formik.setFieldValue("body", tpl?.body ?? "");
  }

  function goBack() {
    setStep((s) => s - 1);
  }

  function goNext() {
    if (step === 1 && !step1Valid) {
      formik.setFieldTouched("segmentId", true);
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
    formik.resetForm();
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-20 h-20 rounded-full bg-[oklch(0.97_0.03_155)] flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-[oklch(0.52_0.16_155)]" />
        </div>
        <h2 className="text-2xl font-normal text-foreground">Campaign Sent!</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Your email has been queued for delivery to{" "}
          <strong>{selectedSegment?.count.toLocaleString()} recipients</strong> in the{" "}
          <strong>{selectedSegment?.label}</strong> segment.
        </p>
        <Button onClick={startNewCampaign}>Send Another Campaign</Button>
      </div>
    );
  }

  return (
    <form onSubmit={formik.handleSubmit} className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-normal text-foreground">Bulk Email</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Reach customers at scale — renewals, promos, and notices in a few clicks
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Step content */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          {/* ── Step 1: Audience ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-normal text-foreground">
                  Who will receive this email?
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose a segment. You can refine the audience further with filters in a future release.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {segments.map((seg) => (
                  <SegmentCard
                    key={seg.id}
                    segment={seg}
                    selected={values.segmentId === seg.id}
                    onSelect={() => formik.setFieldValue("segmentId", seg.id)}
                  />
                ))}
              </div>
              {touched.segmentId && errors.segmentId && (
                <p className="text-xs text-danger">{errors.segmentId}</p>
              )}
            </div>
          )}

          {/* ── Step 2: Compose ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-normal text-foreground">Compose your email</h2>
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

              {/* Subject */}
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

              {/* Body */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  Message body
                </label>
                <textarea
                  rows={12}
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
                    {values.body.length} characters
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
                  This is how your email will appear. Check subject, body, and recipient count carefully.
                </p>
              </div>
              <EmailPreview
                subject={values.subject}
                body={values.body}
                recipientCount={selectedSegment?.count ?? 0}
                segmentLabel={selectedSegment?.label ?? ""}
              />
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
                  { label: "Audience", value: `${selectedSegment?.label} (${selectedSegment?.count.toLocaleString()} recipients)` },
                  { label: "Subject", value: values.subject || "(no subject)" },
                  { label: "Body length", value: `${values.body.length} characters` },
                  { label: "Template", value: templates.find((t) => t.id === values.templateId)?.name ?? "Custom" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-4 py-2.5 border-b border-border last:border-0">
                    <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
                    <span className="text-sm text-foreground font-medium text-right">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-[oklch(0.97_0.02_25)] border border-[oklch(0.88_0.06_25)]">
                <AlertCircle className="w-4 h-4 text-[oklch(0.55_0.18_25)] shrink-0 mt-0.5" />
                <p className="text-xs text-[oklch(0.48_0.14_25)]">
                  Sending to <strong>{selectedSegment?.count.toLocaleString()}</strong> customers is irreversible. Ensure your message is accurate and professional before proceeding.
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
              className="gap-2 bg-[oklch(0.38_0.12_155)] hover:bg-[oklch(0.32_0.12_155)] text-foreground"
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
