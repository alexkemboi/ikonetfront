import { getCustomerById } from "@/actions/customer";
import { notFound } from "next/navigation";
import { BackButton } from "../_components/BackButton";
import CustomerView from "../_components/CustomerView";

interface CustomerDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomerDetailsPage({ params }: CustomerDetailsPageProps) {
  const customerId = parseInt((await params).id);

  if (isNaN(customerId)) {
    notFound();
  }

  const response = await getCustomerById(customerId);

  if (!response.success || !response.data) {
    notFound();
  }

  const customer = response.data;

  return (
    <div className="flex-1 p-8 pt-6">
      <div className="mb-4 flex items-center justify-between">
        {/* <h2 className="text-3xl font-bold tracking-tight">Customer Profile</h2>  */}
        <BackButton customerId={customer.userIdxno} customerIsActive={customer.isActive} />
      </div>

      <CustomerView customer={customer} />
    </div>
  );
}
