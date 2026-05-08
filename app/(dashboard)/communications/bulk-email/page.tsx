import BulkEmailWizard from "./_components/BulkEmailWizard";

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

const AUDIENCE_SEGMENTS: AudienceSegment[] = [
  {
    id: "all",
    label: "All Customers",
    description: "Everyone with an account, regardless of status or plan",
    count: 1842,
    icon: "users",
  },
  {
    id: "pppoe",
    label: "PPPoE Subscribers",
    description: "Dedicated home and business fiber customers",
    count: 1204,
    icon: "wifi",
  },
  {
    id: "hotspot",
    label: "Hotspot Users",
    description: "Session-based hotspot customers",
    count: 638,
    icon: "radio",
  },
  {
    id: "expired",
    label: "Expired Accounts",
    description: "Customers whose subscription has lapsed — win them back",
    count: 312,
    icon: "clock",
  },
  {
    id: "expiring_soon",
    label: "Expiring in 7 Days",
    description: "Send a renewal reminder before they go offline",
    count: 87,
    icon: "bell",
  },
  {
    id: "inactive_30d",
    label: "Inactive 30+ Days",
    description: "No login or usage in the last 30 days",
    count: 156,
    icon: "user-x",
  },
];

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "blank",
    name: "Blank",
    subject: "",
    body: "",
  },
  {
    id: "renewal",
    name: "Renewal Reminder",
    subject: "Your Beesmart subscription is expiring soon",
    body: `Dear {{customer_name}},

Your internet subscription is due to expire on {{expiry_date}}.

To avoid any disruption to your service, please renew your plan before it expires.

Renew now at: https://beesmart.co.ke/renew

Thank you for choosing Beesmart.

Best regards,
The Beesmart Team`,
  },
  {
    id: "promo",
    name: "Promotional Offer",
    subject: "Special offer just for you, {{customer_name}}!",
    body: `Dear {{customer_name}},

We have an exciting offer for you this month!

Upgrade to our 20 Mbps Business plan and get the first month at 50% off.

Valid until: 31st May 2025.

Reply to this email or call 0700 000 000 to upgrade.

Best regards,
The Beesmart Team`,
  },
  {
    id: "maintenance",
    name: "Maintenance Notice",
    subject: "Scheduled maintenance — {{date}}",
    body: `Dear {{customer_name}},

We will be performing scheduled network maintenance on {{date}} between {{start_time}} and {{end_time}}.

During this period, your internet service may be temporarily unavailable.

We apologise for any inconvenience and thank you for your patience.

Best regards,
The Beesmart Network Team`,
  },
];

export default function BulkEmailPage() {
  return (
    <div className="p-6 h-full">
      <BulkEmailWizard
        segments={AUDIENCE_SEGMENTS}
        templates={EMAIL_TEMPLATES}
      />
    </div>
  );
}
