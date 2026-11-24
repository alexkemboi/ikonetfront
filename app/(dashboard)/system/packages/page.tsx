import { getPackageAvailabilityAction, getPackagesAction } from "@/actions/packages";
import PackagesClient from "./_components/PackagesClient";
import { getCurrentUserPermissions, NO_PERMISSIONS } from "@/lib/data/nav";
import { resolveCompanyContextCode } from "@/lib/companyContext";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAccess } from "@/lib/data/access";
import { hasPlatformScope } from "@/lib/access";

export const dynamic = "force-dynamic";

export const metadata = {
 title: "Internet Packages — SpeedLink",
};

export default async function InternetPackagesPage() {
 const permissions = await getCurrentUserPermissions();
 const pagePerms = permissions["/system/packages"] ?? NO_PERMISSIONS;
 if (!pagePerms.canView) redirect("/dashboard");

 // a role that works across companies sees the selected company (or all)
 const isPlatformAdmin = hasPlatformScope(await getAccess());
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
