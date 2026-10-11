import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveDashboardPathForRole } from "@/lib/utils/dashboardRouting";
import { getCustomerById } from "@/actions/customer";
import { CustomerDashboardShell } from "./_components/CustomerDashboardShell";

export const metadata = { title: "Customer Dashboard — Ikonex Systems" };

export default async function CustomerDashboardPage() {
 const session = await auth();
 const correctPath = resolveDashboardPathForRole(session?.user?.role);

 if (correctPath !== "/dashboard/customer") {
 redirect(correctPath);
 }

 // Fetch the logged-in customer's own profile using their session id
 const customerId = parseInt(session?.user?.id ?? "");
 if (isNaN(customerId)) notFound();

 const response = await getCustomerById(customerId);
 if (!response.success || !response.data) notFound();

 return (
 <div className="flex-1 p-8 pt-6">
 <CustomerDashboardShell customer={response.data} />
 </div>
 );
}
