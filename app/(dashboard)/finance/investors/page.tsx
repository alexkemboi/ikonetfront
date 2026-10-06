import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listInvestors } from "@/actions/investorRegistry";
import { getMikrotikDevices } from "@/actions/mikrotik";
import { isPlatformAdminRole, normalizeRole, ROLE_NAME } from "@/lib/types/roles";
import InvestorsClient from "./_components/InvestorsClient";

export const metadata = { title: "Investors" };

/**
 * Investor set-up: the register, agreements with their charge rules, and which
 * routers each investor owns.
 *
 * SYSADMIN does everything. A company admin sees the investors linked to their
 * company and assigns or releases their company's routers.
 */
export default async function InvestorsPage() {
  const session = await auth();
  const role = session?.user?.role ?? "";
  const isPlatformAdmin = isPlatformAdminRole(role);
  const isCompanyAdmin = normalizeRole(role) === ROLE_NAME.ADMIN && !isPlatformAdmin;
  if (!isPlatformAdmin && !isCompanyAdmin) redirect("/dashboard");

  const [investors, devices] = await Promise.all([listInvestors(), getMikrotikDevices()]);
  const routers = (devices.data ?? []).map((d) => ({ id: d.id, name: d.name }));

  return <InvestorsClient investors={investors} routers={routers} isPlatformAdmin={isPlatformAdmin} />;
}
