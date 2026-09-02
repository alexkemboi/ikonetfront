import BulkEmailWizard from "./_components/BulkEmailWizard";
import { getEmailTemplates, getAudienceSegments } from "@/actions/communications";

export const metadata = { title: "Bulk Email — Beesmart" };

export type AudienceSegment = {
 id: string;
 label: string;
 description: string;
 count: number;
 icon: string;
};

export type EmailTemplate = {
 id: string;
 name: string;
 subject: string;
 body: string;
};

export default async function BulkEmailPage() {
 const [templatesResult, segmentsResult] = await Promise.all([
 getEmailTemplates().catch(() => ({ success: false, data: [], message: "Email templates unavailable." })),
 getAudienceSegments().catch(() => ({ success: false, data: [], message: "Audience segments unavailable." })),
 ]);

 const gatedMessage =
  templatesResult?.message ?? segmentsResult?.message ?? undefined;

  const templates: EmailTemplate[] = (templatesResult?.data || []).map((t: {
    id?: unknown;
    name?: unknown;
    subject?: unknown;
    body?: unknown;
  }) => ({
    id: String(t.id ?? ""),
    name: String(t.name ?? ""),
    subject: String(t.subject ?? ""),
    body: String(t.body ?? ""),
  }));

  const segments: AudienceSegment[] = (segmentsResult?.data || []).map((s: {
    id?: unknown;
    label?: unknown;
    name?: unknown;
    description?: unknown;
    count?: unknown;
    icon?: unknown;
  }) => ({
    id: String(s.id ?? ""),
    label: String(s.label ?? s.name ?? ""),
    description: String(s.description ?? ""),
    count: typeof s.count === "number" ? s.count : 0,
    icon: String(s.icon ?? "users"),
  }));

 return (
 <div className="p-6 h-full">
 <BulkEmailWizard
 segments={segments}
 templates={templates}
 gatedMessage={gatedMessage}
 />
 </div>
 );
}