import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuditLogPage } from "@/actions/audit";
import { auth } from "@/lib/auth";
import { resolveCompanyContextCode } from "@/lib/companyContext";
import { getPermissionForRoute } from "@/lib/data/nav";
import { cn } from "@/lib/utils";
import AuditLogsClient from "./_components/AuditLogsClient";
import { getAccess } from "@/lib/data/access";
import { can } from "@/lib/access";

export const metadata = { title: "Audit Logs" };

export default async function AuditLogsPage({
 searchParams,
}: {
 searchParams: Promise<{ scope?: string }>;
}) {
 const pagePerms = await getPermissionForRoute("/system/audit");
 if (!pagePerms.canView) redirect("/dashboard");

 const isPlatformAdmin = can(await getAccess(), "API_AUDITLOG_PLATFORM", "VIEW");
 // The platform log (company switches, events that belong to no company) is SYSADMIN-only.
 const showPlatform = isPlatformAdmin && (await searchParams).scope === "platform";

 const [result, selectedCompany] = await Promise.all([
 getAuditLogPage({ platform: showPlatform, page: 0, size: 50 }),
 isPlatformAdmin ? resolveCompanyContextCode() : Promise.resolve(null),
 ]);
 const firstPage = result.data ?? { content: [], totalElements: 0, page: 0, size: 50, modules: [], actions: [] };

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
 {result.error && (
 <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
 Audit logs could not be loaded: {result.error}
 </p>
 )}
 <AuditLogsClient
 // Remount on scope change so filters from one log do not carry into the other.
 key={showPlatform ? "platform" : "company"}
 initial={firstPage}
 platform={showPlatform}
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
