import { getPackageAvailabilityAction, getPackagesAction } from "@/actions/packages";
import PackagesClient from "./_components/PackagesClient";
import { getCurrentUserPermissions, NO_PERMISSIONS } from "@/lib/data/nav";
import { resolveCompanyContextCode } from "@/lib/companyContext";
import { auth } from "@/lib/auth";
import { isPlatformAdminRole } from "@/lib/types/roles";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
 title: "Internet Packages — Ikonex Systems",
};

export default async function InternetPackagesPage() {
 const permissions = await getCurrentUserPermissions();
 const pagePerms = permissions["/system/packages"] ?? NO_PERMISSIONS;
 if (!pagePerms.canView) redirect("/dashboard");

 const session = await auth();
 const isPlatformAdmin = isPlatformAdminRole(session?.user?.role);
 // The company a SYSADMIN has selected; null = all companies. Other roles are
 // always inside their own company.
 const selectedCompany = isPlatformAdmin ? await resolveCompanyContextCode() : null;
 const allCompanies = isPlatformAdmin && !selectedCompany;

 const [result, availability] = await Promise.all([
 getPackagesAction(),
 // per-router availability belongs to one company
 allCompanies ? Promise.resolve(null) : getPackageAvailabilityAction(),
 ]);
 const packages = result.success ? (result.data ?? []) : [];

 return (
 <div className="p-6">
 {/* Keyed by company: switching company remounts the client, so the table
     never keeps the previous company's packages in its local state. */}
 <PackagesClient
 key={selectedCompany ?? (isPlatformAdmin ? "ALL" : "OWN")}
 packages={packages}
 availability={availability}
 allCompanies={allCompanies}
 />
 </div>
 );
}
