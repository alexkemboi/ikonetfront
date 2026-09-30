import BulkEmailWizard from "./_components/BulkEmailWizard";
import { getEmailTemplates } from "@/actions/communications";
import { getCustomers } from "@/actions/customer";
import { getSystemUsers } from "@/actions/system";

export const metadata = { title: "Bulk Email — Beesmart" };

export type EmailTemplate = {
 id: string;
 name: string;
 subject: string;
 body: string;
};

export type CampaignRecipient = {
 id: number;
 name: string;
 email: string | null;
 recipientType: "CUSTOMER" | "SYSTEM_USER";
 selectable: boolean;
};

const BUILT_IN_TEMPLATES: EmailTemplate[] = [
 { id: "renewal-reminder", name: "Renewal Reminder", subject: "Your subscription is expiring soon", body: "Hi {{customer_name}},\n\nYour internet subscription is expiring soon. Renew now to avoid interruption.\n\nThank you." },
 { id: "service-notice", name: "Service Notice", subject: "Scheduled maintenance notice", body: "Hi {{customer_name}},\n\nWe will be performing scheduled maintenance that may briefly affect your service.\n\nThank you for your patience." },
];

export default async function BulkEmailPage() {
 const [templatesResult, customersResult, systemUsers] = await Promise.all([
   getEmailTemplates(),
  getCustomers(0, 200),
   getSystemUsers(),
 ]);

  const customers: CampaignRecipient[] = customersResult.success
    ? (customersResult.data?.content ?? []).map((customer) => ({
      id: customer.userIdxno,
      name: customer.fullName || customer.username,
      email: customer.email?.trim() || null,
      recipientType: "CUSTOMER",
      selectable: Boolean(customer.email?.trim()),
    }))
    : [];
  const staff: CampaignRecipient[] = systemUsers.map((user) => ({
    id: user.idxno,
    name: user.fullName || user.username,
    email: user.email?.trim() || null,
    recipientType: "SYSTEM_USER",
    selectable: Boolean(user.email?.trim()),
  }));
  const templates: EmailTemplate[] = templatesResult.success && templatesResult.data.length > 0
    ? templatesResult.data.map((value) => {
      const template = value as Record<string, unknown>;
      return {
        id: String(template.id ?? ""),
        name: String(template.name ?? ""),
        subject: String(template.subject ?? ""),
        body: String(template.body ?? ""),
      };
    })
    : BUILT_IN_TEMPLATES;

 return (
 <div className="p-6 h-full">
 <BulkEmailWizard
 customers={customers}
 systemUsers={staff}
 templates={templates}
 templateNotice={!templatesResult.success || templatesResult.data.length === 0 ? templatesResult.message ?? "Using built-in templates because no saved templates are available." : undefined}
 templateRequestId={templatesResult.requestId}
 recipientError={!customersResult.success ? customersResult.message ?? "Customer recipients are unavailable." : undefined}
 recipientRequestId={customersResult.requestId}
 />
 </div>
 );
}