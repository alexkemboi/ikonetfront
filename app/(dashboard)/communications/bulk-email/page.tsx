import BulkEmailWizard from "./_components/BulkEmailWizard";
import { getEmailTemplates, getAudienceSegments } from "@/actions/communications";

export const metadata = { title: "Bulk Email — Beesmart" };

export default async function BulkEmailPage() {
  const [templatesResult, segmentsResult] = await Promise.all([
    getEmailTemplates(),
    getAudienceSegments(),
  ]);

  return (
    <div className="p-6 pb-16 mb-6 h-full">
      <BulkEmailWizard
        segments={segmentsResult.data}
        templates={templatesResult.data}
      />
    </div>
  );
}
