import BulkEmailWizard from "./_components/BulkEmailWizard";
import { getEmailTemplates } from "@/actions/communications";
import { getCustomers } from "@/actions/customer";
import { getSystemUsers } from "@/actions/system";

export const metadata = { title: "Bulk Email — Beesmart" };

export default async function BulkEmailPage() {
  const [templatesResult, customersResult, systemUsers] = await Promise.all([
    getEmailTemplates(),
    getCustomers(0, 50),
    getSystemUsers(),
  ]);

  return (
    <div className="p-6 pb-16 h-full">
      <BulkEmailWizard
        templates={templatesResult.data}
        customers={customersResult.data?.content ?? []}
        systemUsers={systemUsers}
      />
    </div>
  );
}
