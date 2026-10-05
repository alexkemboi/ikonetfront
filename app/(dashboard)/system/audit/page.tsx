import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuditLogsAction, getPlatformAuditLogsAction } from "@/actions/audit";
import { auth } from "@/lib/auth";
import { resolveCompanyContextCode } from "@/lib/companyContext";
import { getPermissionForRoute } from "@/lib/data/nav";
import { isPlatformAdminRole } from "@/lib/types/roles";
import { cn } from "@/lib/utils";
import AuditLogsClient from "./_components/AuditLogsClient";

export const metadata = { title: "Audit Logs — Beesmart" };

export default async function AuditLogsPage({
 searchParams,
}: {
 searchParams: Promise<{ scope?: string }>;
}) {
 const pagePerms = await getPermissionForRoute("/system/audit");
 if (!pagePerms.canView) redirect("/dashboard");

 const session = await auth();
 const isPlatformAdmin = isPlatformAdminRole(session?.user?.role);
 // The platform log (company switches, events that belong to no company) is SYSADMIN-only.
 const showPlatform = isPlatformAdmin && (await searchParams).scope === "platform";

 const result = showPlatform ? await getPlatformAuditLogsAction() : await getAuditLogsAction();
 const logs = result.success ? (result.data ?? []) : [];
 const selectedCompany = isPlatformAdmin ? await resolveCompanyContextCode() : null;

 // Sort newest-first once on the server — no need to re-sort on every client filter
 const sorted = [...logs].sort(
 (a, b) => new Date(b.accessTime).getTime() - new Date(a.accessTime).getTime()
 );

 // Derive unique filter options server-side so the client doesn't need useMemo for these
 const methods = Array.from(new Set(logs.map((l) => l.action))).sort();
 const modules = Array.from(new Set(logs.map((l) => l.module))).sort();

 const tabs = [
 { href: "/system/audit", label: "Company audit", active: !showPlatform },
 { href: "/system/audit?scope=platform", label: "Platform audit", active: showPlatform },
 ];

 return (
 <div className="p-6 space-y-4">
 {isPlatformAdmin && (
 <nav className="flex gap-1 border-b border-border" aria-label="Audit log scope">
 {tabs.map((tab) => (
 <Link
 key={tab.href}
 href={tab.href}
 aria-current={tab.active ? "page" : undefined}
 className={cn(
 "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
 tab.active
 ? "border-primary font-medium text-foreground"
 : "border-transparent text-muted-foreground hover:text-foreground"
 )}
 >
 {tab.label}
 </Link>
 ))}
 </nav>
 )}
 {!result.success && (
 <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
 Audit logs could not be loaded: {result.message}
 </p>
 )}
 <AuditLogsClient
 // Remount on scope change so filters from one log do not carry into the other.
 key={showPlatform ? "platform" : "company"}
 logs={sorted}
 methods={methods}
 modules={modules}
 title={showPlatform ? "Platform Audit Log" : "Audit Logs"}
 subtitle={
 showPlatform
 ? "Company switches and events that belong to no company"
 : isPlatformAdmin
 ? selectedCompany ? `Events of ${selectedCompany}` : "Events of all companies"
 : undefined
 }
 />
 </div>
 );
}
