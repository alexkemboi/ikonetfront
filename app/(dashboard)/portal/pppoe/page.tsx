import { getCustomers } from "@/actions/customer";
import { getPppoePackagesAction } from "@/actions/pppoe";
import { PPPoECustomerTable } from "./_components/PPPoECustomerTable";

export const metadata = { title: "PPPoE Clients — Beesmart Billing" };

export default async function PppoeCustomersPage() {
  const [response, packagesRes] = await Promise.all([
    getCustomers(0, 50, { custtype: "pppoe" }),
    getPppoePackagesAction(),
  ]);
  const customers = response.success ? (response.data?.content ?? []) : [];
  const packages = packagesRes.success ? (packagesRes.data ?? []) : [];

  return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PPPoECustomerTable customers={customers} packages={packages} />
      </div>
    </div>
  );
}