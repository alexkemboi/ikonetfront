import { redirect } from "next/navigation";
import { getPppoePackagesAction } from "@/actions/pppoe";
import { getPermissionForRoute } from "@/lib/data/nav";
import { PppoePackagesClient } from "./_components/PppoePackagesClient";

export const metadata = { title: "PPPoE Packages — Ikonex Systems" };

export default async function PppoePackagesPage() {
  // PPPoE packages are part of the PPPoE Clients area and share its permissions.
  const pagePerms = await getPermissionForRoute("/portal/pppoe");
  if (!pagePerms.canView) redirect("/dashboard");

  const res = await getPppoePackagesAction();

  return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PppoePackagesClient
          initialPackages={res.success ? (res.data ?? []) : []}
          loadError={res.success ? null : res.message}
        />
      </div>
    </div>
  );
}
