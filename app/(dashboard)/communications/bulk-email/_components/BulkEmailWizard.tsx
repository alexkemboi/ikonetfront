"use client";

import { useMemo, useState } from "react";
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
 MessageSquare,
} from "lucide-react";
import type { CampaignRecipient, EmailTemplate } from "../page";
import { sendBulkEmailAction } from "@/actions/communications";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
 customers: CampaignRecipient[];
 systemUsers: CampaignRecipient[];
 templates: EmailTemplate[];
 templateNotice?: string;
 templateRequestId?: string;
 recipientError?: string;
 recipientRequestId?: string;
}

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

function EmailPreview({
 subject,
 body,
 recipientCount,
 recipientLabel,
}: {
 subject: string;
 body: string;
 recipientCount: number;
 recipientLabel: string;
}) {
 return (
 <div className="space-y-4">
 <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
 <div className="flex items-center gap-2 text-sm">
 <span className="text-muted-foreground">To:</span>
 <Badge variant="outline" className="text-xs">
 {recipientLabel}
 </Badge>
 <span className="text-muted-foreground text-xs">
 ({recipientCount.toLocaleString()} recipients)
 </span>
 </div>
 </div>

 <div className="rounded-xl border border-border overflow-hidden bg-white">
 {/* Email "chrome" */}
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

export default function BulkEmailWizard({ customers, systemUsers, templates, templateNotice, templateRequestId, recipientError, recipientRequestId }: Props) {
 const [step, setStep] = useState(1);
 const [recipientType, setRecipientType] = useState<CampaignRecipient["recipientType"]>("CUSTOMER");
 const [recipientSearch, setRecipientSearch] = useState("");
 const [selectedRecipientKeys, setSelectedRecipientKeys] = useState<Set<string>>(new Set());
 const [channel, setChannel] = useState<"EMAIL" | "SMS">("EMAIL");
 const [selectedTemplateId, setSelectedTemplateId] = useState("blank");
 const [subject, setSubject] = useState("");
 const [body, setBody] = useState("");
 const [sent, setSent] = useState(false);
 const [sendError, setSendError] = useState<string | null>(null);
 const [sendRequestId, setSendRequestId] = useState<string | undefined>();

 const recipients = recipientType === "CUSTOMER" ? customers : systemUsers;
 const visibleRecipients = useMemo(() => {
   const query = recipientSearch.trim().toLowerCase();
  return recipients.filter((recipient) => !query || recipient.name.toLowerCase().includes(query) || (recipient.email ?? "").toLowerCase().includes(query));
 }, [recipients, recipientSearch]);
 const selectedRecipients = useMemo(() => [...customers, ...systemUsers].filter((recipient) => selectedRecipientKeys.has(`${recipient.recipientType}:${recipient.id}`)), [customers, systemUsers, selectedRecipientKeys]);
 const selectedRecipientLabel = `${selectedRecipients.length} selected recipients`;
 const selectableVisible = visibleRecipients.filter((recipient) => recipient.selectable);
 const allVisibleSelected = selectableVisible.length > 0 && selectableVisible.every((recipient) => selectedRecipientKeys.has(`${recipient.recipientType}:${recipient.id}`));

 function toggleRecipient(recipient: CampaignRecipient) {
   if (!recipient.selectable) return;
   const key = `${recipient.recipientType}:${recipient.id}`;
   setSelectedRecipientKeys((current) => {
     const next = new Set(current);
     if (next.has(key)) next.delete(key);
     else next.add(key);
     return next;
   });
 }

 function toggleVisibleRecipients() {
   setSelectedRecipientKeys((current) => {
     const next = new Set(current);
    if (allVisibleSelected) selectableVisible.forEach((recipient) => next.delete(`${recipient.recipientType}:${recipient.id}`));
    else selectableVisible.forEach((recipient) => next.add(`${recipient.recipientType}:${recipient.id}`));
     return next;
   });
 }

 function handleTemplateChange(templateId: string) {
 setSelectedTemplateId(templateId);
 const tpl = templates.find((t) => t.id === templateId);
 if (tpl && templateId !== "blank") {
 setSubject(tpl.subject);
 setBody(tpl.body);
 } else if (templateId === "blank") {
 setSubject("");
 setBody("");
 }
 }

 async function handleSend() {
 if (selectedRecipients.length === 0 || recipientError || channel !== "EMAIL") return;
 setSendError(null);
 setSendRequestId(undefined);
 const result = await sendBulkEmailAction({
 recipients: selectedRecipients.map(({ recipientType: type, id }) => ({ recipientType: type, recipientId: id })),
 templateId: selectedTemplateId,
 subject,
 body: body,
 });
 if (result.success) {
 setSent(true);
 } else {
 setSendError(result.message || "Failed to send campaign.");
 setSendRequestId(result.requestId);
 }
 }

 if (sent) {
 return (
 <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
 <div className="w-20 h-20 rounded-full bg-[oklch(0.97_0.03_155)] flex items-center justify-center">
 <CheckCircle2 className="w-10 h-10 text-[oklch(0.52_0.16_155)]" />
 </div>
 <h2 className="text-2xl font-normal text-foreground">Campaign Sent!</h2>
 <p className="text-sm text-muted-foreground text-center max-w-xs">
 Your email has been queued for delivery to <strong>{selectedRecipients.length.toLocaleString()} recipients</strong>.
 </p>
 <Button
 onClick={() => {
 setSent(false);
 setStep(1);
 setSelectedRecipientKeys(new Set());
 setSelectedTemplateId("blank");
 setSubject("");
 setBody("");
 }}
 >
 Send Another Campaign
 </Button>
 </div>
 );
 }

 return (
 <div className="max-w-3xl mx-auto space-y-8">
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
 <CardContent className="p-6">
 {/* ── Step 1: Audience ── */}
 {step === 1 && (
 <div className="space-y-4">
 <div>
 <h2 className="text-base font-normal text-foreground">
 Who will receive this email?
 </h2>
 <p className="text-xs text-muted-foreground mt-0.5">Choose a channel and select recipients individually.</p>
 </div>
 <div className="flex flex-wrap gap-2" role="group" aria-label="Delivery channel">
 <Button type="button" variant={channel === "EMAIL" ? "default" : "outline"} onClick={() => setChannel("EMAIL")} className="gap-1.5"><Mail className="h-4 w-4"/>Email</Button>
 <Button type="button" variant="outline" disabled title="SMS campaign delivery is not available in the configured backend API"><MessageSquare className="h-4 w-4"/>SMS unavailable</Button>
 </div>
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="flex gap-2" role="group" aria-label="Recipient type">
 <Button type="button" size="sm" variant={recipientType === "CUSTOMER" ? "default" : "outline"} onClick={() => setRecipientType("CUSTOMER")} className="gap-1.5"><Users className="h-3.5 w-3.5"/>Customers</Button>
 <Button type="button" size="sm" variant={recipientType === "SYSTEM_USER" ? "default" : "outline"} onClick={() => setRecipientType("SYSTEM_USER")} className="gap-1.5"><UserX className="h-3.5 w-3.5"/>System Users</Button>
 </div>
 <Input aria-label="Search recipients" placeholder="Search by name" value={recipientSearch} onChange={(event) => setRecipientSearch(event.target.value)} className="h-8 w-full sm:w-56" />
 </div>
 <div className="overflow-hidden rounded-lg border border-border">
 <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2">
 <label className="flex cursor-pointer items-center gap-2 text-xs font-medium"><Checkbox checked={allVisibleSelected} onCheckedChange={toggleVisibleRecipients} />Select all visible</label>
 <span className="text-xs tabular-nums text-muted-foreground">{selectedRecipients.length} selected</span>
 </div>
 <div className="max-h-72 divide-y divide-border overflow-y-auto">
 {visibleRecipients.map((recipient) => {
   const key = `${recipient.recipientType}:${recipient.id}`;
   return <label key={key} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40">
    <Checkbox checked={selectedRecipientKeys.has(key)} disabled={!recipient.selectable} onCheckedChange={() => toggleRecipient(recipient)} />
    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{recipient.name}</span><span className="block truncate text-xs text-muted-foreground">{recipient.email ?? "No email on file"}</span></span>
   </label>;
 })}
 {visibleRecipients.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">No recipients with email addresses match this search.</p>}
 </div>
 </div>
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
 <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
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

 {/* Subject */}
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-foreground">
 Subject line
 </label>
 <Input
 placeholder="e.g. Your subscription is expiring soon"
 value={subject}
 onChange={(e) => setSubject(e.target.value)}
 className="h-10"
 />
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
 value={body}
 onChange={(e) => setBody(e.target.value)}
 className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-sans tabular-nums resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground"
 />
 <p className="text-[11px] text-muted-foreground text-right">
 {body.length} characters
 </p>
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
 subject={subject}
 body={body}
 recipientCount={selectedRecipients.length}
 recipientLabel={selectedRecipientLabel}
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
 { label: "Recipients", value: `${selectedRecipients.length.toLocaleString()} selected` },
 { label: "Channel", value: channel === "EMAIL" ? "Email" : "SMS" },
 { label: "Subject", value: subject || "(no subject)" },
 { label: "Body length", value: `${body.length} characters` },
 { label: "Template", value: templates.find((t) => t.id === selectedTemplateId)?.name ?? "Custom" },
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
 Sending to <strong>{selectedRecipients.length.toLocaleString()}</strong> selected recipients is irreversible. Ensure your message is accurate and professional before proceeding.
 </p>
 </div>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Navigation */}
 <div className="flex items-center justify-between">
 <Button
 variant="outline"
 onClick={() => setStep((s) => s - 1)}
 disabled={step === 1}
 className="gap-1.5"
 >
 <ChevronLeft className="w-4 h-4" />
 Back
 </Button>

 <div className="flex items-center gap-2">
 {step < 4 ? (
 <Button
 onClick={() => setStep((s) => s + 1)}
 disabled={(step === 1 && (selectedRecipients.length === 0 || Boolean(recipientError))) || (step === 2 && Boolean(recipientError))}
 className="gap-1.5"
 >
 {step === 3 ? "Confirm & Review" : "Continue"}
 <ChevronRight className="w-4 h-4" />
 </Button>
 ) : (
 <Button
 onClick={handleSend}
 disabled={!subject.trim() || !body.trim() || selectedRecipients.length === 0 || Boolean(recipientError) || channel !== "EMAIL"}
 className="gap-2 bg-[oklch(0.38_0.12_155)] hover:bg-[oklch(0.32_0.12_155)] text-foreground"
 >
 <Send className="w-4 h-4" />
 Send Campaign
 </Button>
 )}
 </div>
 </div>
 </div>
 );
}
