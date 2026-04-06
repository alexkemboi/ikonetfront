import { getCustomers } from "@/actions/customer";
import { CustomerClient } from "../all/_components/CustomerClient"; // Reusing the client component

export default async function PppoeCustomersPage() {
  const response = await getCustomers(0, 10, { custtype: "pppoe" }); // Fetch only PPPoE customers
  const customers = response.success ? response.data.content : [];

  return (
    <div className="flex-1 p-8 pt-6">
      <CustomerClient initialCustomers={customers} />
    </div>
  );
}
