import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveDashboardPathForRole } from "@/lib/utils/dashboardRouting";
import { getCustomers } from "@/actions/customer";
import { StaffDashboardShell } from "./_components/StaffDashboardShell";

export const metadata = { title: "Staff Dashboard — Beesmart Billing" };

export default async function StaffDashboardPage() {
 const session = await auth();
 const correctPath = resolveDashboardPathForRole(session?.user?.role);

 if (correctPath !== "/dashboard/staff") {
 redirect(correctPath);
 }

 const sevenDaysFromNow = new Date();
 sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

 const [allCustomersRes, activeCustomersRes, pppoeCustomersRes, recentCustomersRes] =
 await Promise.all([
 getCustomers(0, 1),
 getCustomers(0, 1, { isActive: true }),
 getCustomers(0, 50, { custtype: "pppoe" }),
 getCustomers(0, 10), // latest 10 for the recent list
 ]);

 const totalCustomers = allCustomersRes.data?.totalElements ?? 0;
 const activeCustomers = activeCustomersRes.data?.totalElements ?? 0;
 const allPPPoE = pppoeCustomersRes.success ? pppoeCustomersRes.data.content : [];
 const recentCustomers = recentCustomersRes.success
 ? recentCustomersRes.data.content
 : [];

 // Customers whose subscription expires within 7 days
 const urgentRenewals = allPPPoE.filter((c:any) => {
 if (!c.expiryDate) return false;
 const expiry = new Date(c.expiryDate);
 const now = new Date();
 return expiry >= now && expiry <= sevenDaysFromNow;
 });

 const greeting = `Good day, ${session?.user?.fname ?? "Staff"}!`;

 return (
 <div className="flex-1 p-8 pt-6">
 <StaffDashboardShell
 totalCustomers={totalCustomers}
 activeCustomers={activeCustomers}
 urgentRenewals={urgentRenewals}
 recentCustomers={recentCustomers}
 greeting={greeting}
 />
 </div>
 );
}
