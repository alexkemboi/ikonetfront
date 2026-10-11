import { getCustomers } from "@/actions/customer";
import { PPPoECustomerTable } from "./_components/PPPoECustomerTable";

export const metadata = { title: "PPPoE Clients — Ikonex Systems" };

export default async function PppoeCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ assign?: string }>;
}) {
  const { assign } = await searchParams;
  const response = await getCustomers(0, 50, { custtype: "pppoe" });
  const customers = response.success ? (response.data?.content ?? []) : [];

return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PPPoECustomerTable customers={customers} assignUserIdxno={Number(assign) || undefined} />
      </div>
    </div>
  );
}
