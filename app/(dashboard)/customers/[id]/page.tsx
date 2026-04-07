import { getCustomerById } from "@/actions/customer";
import { notFound } from "next/navigation";
import { PPPoECustomerProfile } from "./_components/PPPoECustomerProfile";

interface CustomerDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailsPage({
  params,
}: CustomerDetailsPageProps) {
  const customerId = parseInt((await params).id);

  if (isNaN(customerId)) {
    notFound();
  }

  const response = await getCustomerById(customerId);

  if (!response.success || !response.data) {
    notFound();
  }

  return (
    <div className="flex-1 p-8 pt-6">
      <PPPoECustomerProfile customer={response.data} />
    </div>
  );
}
