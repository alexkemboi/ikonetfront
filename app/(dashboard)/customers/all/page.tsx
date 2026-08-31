import { getCustomers } from "@/actions/customer";
import { CustomerClient } from "./_components/CustomerClient";
import { getCurrentUserPermissions, NO_PERMISSIONS } from "@/lib/data/nav";
import { redirect } from "next/navigation";

export const metadata = {
 title: "Customer Directory — Beesmart Billing",
 description: "Manage subscriber profiles, active PPPoE sessions, and bandwidth subscriptions.",
};

export default async function AllCustomersPage() {
 const permissions = await getCurrentUserPermissions();
 const pagePerms = permissions["/customers/all"] ?? NO_PERMISSIONS;
 if (!pagePerms.canView) redirect("/dashboard");

 const [firstPage, activeRes, pppoeRes, hotspotRes] = await Promise.all([
 getCustomers(0, 10),
 getCustomers(0, 1, { isActive: true }),
 getCustomers(0, 1, { custtype: "pppoe" }),
 getCustomers(0, 1, { custtype: "hotspot" }),
 ]);

return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <CustomerClient
          initialTotalElements={firstPage?.data?.totalElements ?? 0}
          initialActiveCount={activeRes?.data?.totalElements ?? 0}
          initialPppoeCount={pppoeRes?.data?.totalElements ?? 0}
          initialHotspotCount={hotspotRes?.data?.totalElements ?? 0}
          initialData={firstPage?.data?.content ?? []}
        />
      </div>
    </div>
  );
}