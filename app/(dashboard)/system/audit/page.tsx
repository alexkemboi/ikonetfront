import { getAuditLogsAction } from "@/actions/audit";
import AuditLogsClient from "./_components/AuditLogsClient";

export const metadata = { title: "Audit Logs — Beesmart" };

export default async function AuditLogsPage() {
 const result = await getAuditLogsAction();
 const logs = result.success ? (result.data ?? []) : [];

 // Sort newest-first once on the server — no need to re-sort on every client filter
 const sorted = [...logs].sort(
 (a, b) => new Date(b.accessTime).getTime() - new Date(a.accessTime).getTime()
 );

 // Derive unique filter options server-side so the client doesn't need useMemo for these
 const methods = Array.from(new Set(logs.map((l) => l.action))).sort();
 const modules = Array.from(new Set(logs.map((l) => l.module))).sort();

 return (
 <div className="p-6">
 <AuditLogsClient logs={sorted} methods={methods} modules={modules} />
 </div>
 );
}
