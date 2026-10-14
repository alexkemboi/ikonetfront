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
 These are the SMS and email accounts the system sends through. Who receives what is set by the system:
 customers get renewal reminders, outage notices, payment confirmations and ticket updates; company admins
 get an SMS when a router has been down for 10 minutes.
 </p>
 <AlertsClient providers={providers} activeChannels={[]} canManage={canManage} />
 </div>
 );
}
