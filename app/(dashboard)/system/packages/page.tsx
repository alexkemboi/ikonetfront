import { getPackagesAction } from "@/actions/packages";
import PackagesClient from "./_components/PackagesClient";
import { getCurrentUserPermissions, NO_PERMISSIONS } from "@/lib/data/nav";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Internet Packages — Beesmart Billing",
};

export default async function InternetPackagesPage() {
  const permissions = await getCurrentUserPermissions();
  const pagePerms = permissions["/system/packages"] ?? NO_PERMISSIONS;
  if (!pagePerms.canView) redirect("/dashboard");

  const result = await getPackagesAction();
  const packages = result.success ? (result.data ?? []) : [];

  return (
    <div className="p-6">
      <PackagesClient packages={packages} />
    </div>
  );
}
