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
 <AlertsClient providers={providers} activeChannels={[]} canManage={canManage} />
 </div>
 );
}
