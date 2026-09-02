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
 getEmailTemplates().catch(() => ({ success: false, data: [] })),
 getAudienceSegments().catch(() => ({ success: false, data: [] })),
 ]);

  const templates: EmailTemplate[] = (templatesResult?.data || []).map((t: {
    id?: unknown;
    name?: unknown;
    subject?: unknown;
    body?: unknown;
  }) => ({
    id: t.id?.toString() || "",
    name: t.name || "",
    subject: t.subject || "",
    body: t.body || "",
  }));

  const segments: AudienceSegment[] = (segmentsResult?.data || []).map((s: {
    id?: unknown;
    label?: unknown;
    name?: unknown;
    description?: unknown;
    count?: unknown;
    icon?: unknown;
  }) => ({
    id: s.id?.toString() || "",
    label: s.label || s.name || "",
    description: s.description || "",
    count: s.count || 0,
    icon: s.icon || "users",
  }));

 return (
 <div className="p-6 h-full">
 <BulkEmailWizard
 segments={segments}
 templates={templates}
 />
 </div>
 );
}