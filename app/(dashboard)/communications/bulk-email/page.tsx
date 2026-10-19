import Link from "next/link";
import { getPermissionForRoute } from "@/lib/data/nav";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { getOptOuts, getPromotions } from "@/actions/promotions";
import { PromotionsClient } from "@/components/communications/PromotionsClient";
import { redirect } from "next/navigation";
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
  /** Carried from the customer/staff record so the SMS channel stays usable. */
  phoneNumber: string | null;
  recipientType: "CUSTOMER" | "SYSTEM_USER";
  selectable: boolean;
};

const BUILT_IN_TEMPLATES: EmailTemplate[] = [
 { id: "renewal-reminder", name: "Renewal Reminder", subject: "Your subscription is expiring soon", body: "Hi {{customer_name}},\n\nYour internet subscription is expiring soon. Renew now to avoid interruption.\n\nThank you." },
 { id: "service-notice", name: "Service Notice", subject: "Scheduled maintenance notice", body: "Hi {{customer_name}},\n\nWe will be performing scheduled maintenance that may briefly affect your service.\n\nThank you for your patience." },
];

export default async function BulkEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const pagePerms = await getPermissionForRoute("/communications/bulk-email");
  if (!pagePerms.canView) redirect("/dashboard");

  const promotionsTab = (await searchParams).tab === "promotions";
  const tabs = (
    <nav className="mb-4 flex gap-1 border-b border-border" aria-label="Communication type">
      {[
        { href: "/communications/bulk-email", label: "Email", active: !promotionsTab },
        { href: "/communications/bulk-email?tab=promotions", label: "Promotional SMS", active: promotionsTab },
      ].map((tab) => (
        <Link key={tab.href} href={tab.href} aria-current={tab.active ? "page" : undefined}
          className={cn("-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
            tab.active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );

  if (promotionsTab) {
    // Only this tab's data is loaded; the email tab's customer and staff lists are not needed here.
    const [session, promotions, optOuts] = await Promise.all([auth(), getPromotions(), getOptOuts()]);
    const role = (session?.user?.role ?? "").replace(/^ROLE_/i, "").toUpperCase();
    const isAdmin = role === "SYSADMIN" || role === "ADMIN" || role === "01";
    return (
      <div className="p-6 h-full">
        {tabs}
        <PromotionsClient
          initialPromotions={promotions.data}
          initialOptOuts={optOuts.data}
          loadError={promotions.error ?? optOuts.error ?? undefined}
          canDraft={isAdmin || role === "02"}
          canSend={isAdmin}
          canRemoveOptOut={isAdmin}
        />
      </div>
    );
  }

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
      phoneNumber: customer.phoneNumber?.trim() || null,
      recipientType: "CUSTOMER",
      selectable: Boolean(customer.email?.trim()),
    }))
    : [];
  const staff: CampaignRecipient[] = systemUsers.map((user) => ({
    id: user.idxno,
    name: user.fullName || user.username,
    email: user.email?.trim() || null,
    phoneNumber: user.phoneNumber?.trim() || null,
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
 {tabs}
 {/* No bulk email service exists on the server yet (gap register #10): say so before anyone composes a campaign. */}
 <div role="status" className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
 <p className="font-medium text-foreground">Bulk email is not available yet</p>
 <p className="mt-1 text-muted-foreground">
 You can prepare a message here, but the server cannot send campaigns yet, so nothing will be delivered.
 Customers already receive renewal reminders, outage notices, payment confirmations and ticket updates automatically.
 </p>
 </div>
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
