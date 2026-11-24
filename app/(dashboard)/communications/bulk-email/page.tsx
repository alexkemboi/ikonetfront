import Link from "next/link";
import { getPermissionForRoute } from "@/lib/data/nav";
import { getAccess } from "@/lib/data/access";
import { can } from "@/lib/access";
import { cn } from "@/lib/utils";
import { getOptOuts, getPromotions } from "@/actions/promotions";
import { PromotionsClient } from "@/components/communications/PromotionsClient";
import { redirect } from "next/navigation";
import BulkEmailWizard from "./_components/BulkEmailWizard";
import { getAudienceTree, getEmailCampaigns, getEmailTemplates, getSenderSettings, getSmsNotices } from "@/actions/communications";
import { SenderSettingsClient } from "@/components/communications/SenderSettingsClient";
import { EmailCampaignHistory } from "@/components/communications/EmailCampaignHistory";
import { SmsNoticeHistory } from "@/components/communications/SmsNoticeHistory";
import { getSystemUsers } from "@/actions/system";

export const metadata = { title: "SMS & Emails — SpeedLink" };

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

  const tab = (await searchParams).tab;
  const promotionsTab = tab === "promotions";
  const senderTab = tab === "sender";
  const tabs = (
    <nav className="mb-4 flex gap-1 border-b border-border" aria-label="Communication type">
      {[
        { href: "/communications/bulk-email", label: "Send SMS or email", active: !promotionsTab && !senderTab },
        { href: "/communications/bulk-email?tab=promotions", label: "Promotional SMS", active: promotionsTab },
        { href: "/communications/bulk-email?tab=sender", label: "Sender settings", active: senderTab },
      ].map((tab) => (
        <Link key={tab.href} href={tab.href} aria-current={tab.active ? "page" : undefined}
          className={cn("-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
            tab.active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );

  if (senderTab) {
    const [access, sender] = await Promise.all([getAccess(), getSenderSettings()]);
    return (
      <div className="p-6 h-full">
        {tabs}
        {sender.message && !sender.data ? (
          <p role="alert" className="text-sm text-muted-foreground">{sender.message}</p>
        ) : (
          <SenderSettingsClient initial={sender.data} canEdit={can(access, "API_COMMUNICATIONS_SENDER_SETTINGS", "EDIT")} />
        )}
      </div>
    );
  }

  if (promotionsTab) {
    // Only this tab's data is loaded; the email tab's customer and staff lists are not needed here.
    const [access, promotions, optOuts, tree] = await Promise.all([getAccess(), getPromotions(), getOptOuts(), getAudienceTree()]);
    return (
      <div className="p-6 h-full">
        {tabs}
        <PromotionsClient
          tree={tree.data}
          initialPromotions={promotions.data}
          initialOptOuts={optOuts.data}
          loadError={promotions.error ?? optOuts.error ?? undefined}
          canDraft={can(access, "API_PROMO_ROOT", "CREATE")}
          canSend={can(access, "API_PROMO_SEND", "CREATE")}
          canRemoveOptOut={can(access, "API_PROMO_OPT_OUTS", "DELETE")}
        />
      </div>
    );
  }

 // Customers are not loaded here: the wizard asks for them by place on the network.
 const [templatesResult, tree, systemUsers, campaigns, notices] = await Promise.all([
   getEmailTemplates(),
   getAudienceTree(),
   getSystemUsers(),
   getEmailCampaigns(),
   getSmsNotices(),
 ]);
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
 <BulkEmailWizard
 tree={tree.data}
 systemUsers={staff}
 templates={templates}
 templateNotice={!templatesResult.success || templatesResult.data.length === 0 ? templatesResult.message ?? "Using built-in templates because no saved templates are available." : undefined}
 templateRequestId={templatesResult.requestId}
 recipientError={tree.data ? undefined : tree.message ?? "Customer recipients are unavailable."}
 />
 <SmsNoticeHistory notices={notices} tree={tree.data} />
 <EmailCampaignHistory campaigns={campaigns} />
 </div>
 );
}
