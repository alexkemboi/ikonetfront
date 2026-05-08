import { getCustomers } from "@/actions/customer";
import { PPPoECustomerTable } from "./_components/PPPoECustomerTable";

export default async function PppoeCustomersPage() {
  const response = await getCustomers(0, 50, { custtype: "pppoe" });
  const customers = response.success ? response.data.content : [];

  return (
    <div className="p-8 pt-6">
      <PPPoECustomerTable customers={customers} />
    </div>
  );
}
