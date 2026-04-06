import { getCustomers } from "@/actions/customer";
import { CustomerClient } from "./_components/CustomerClient";

export default async function AllCustomersPage() {
  const response = await getCustomers();
  const customers = response.success ? response.data.content : [];

  return (
    <div className="flex-1 p-8 pt-6">
      <CustomerClient initialCustomers={customers} />
    </div>
  );
}
