import AlertsClient from "./_components/AlertsClient";
import { getProvidersAction } from "@/actions/alerts";
import { auth } from "@/lib/auth";
import { isPlatformAdminRole } from "@/lib/types/roles";

export const metadata = { title: "Alert Channels — Beesmart" };

export default async function AlertsPage() {
 const result = await getProvidersAction();
 const providers = result.success ? (result.data ?? []) : [];
 // Providers are shared by every company: only SYSADMIN may add, change or delete one
 // (the API refuses anyone else and shows the API key to SYSADMIN only).
 const session = await auth();
 const canManage = isPlatformAdminRole(session?.user?.role ?? "");

 return (
 <div className="p-6">
 <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
 These are the SMS and email accounts the system sends through. Customers get renewal reminders, outage
 notices, payment confirmations and ticket updates. Staff, investors and platform admins get alerts about
 what concerns their role (routers down and back up, tickets, payment problems, system fees, the platform),
 and each person chooses which ones under <a href="/account/alerts" className="underline">My alerts</a>.
 </p>
 <AlertsClient providers={providers} activeChannels={[]} canManage={canManage} />
 </div>
 );
}
