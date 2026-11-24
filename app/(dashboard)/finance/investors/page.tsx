import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getInvestor, listInvestors, listRouterAssignments, listStatementMonths } from "@/actions/investorRegistry";
import { getMikrotikDevices } from "@/actions/mikrotik";
import InvestorsClient from "./_components/InvestorsClient";
import SystemFeesLedger from "./_components/SystemFeesLedger";
import type { RouterOption } from "./_components/RouterPicker";
import { getFeeBalances, getFeeReceivingAccount, getFeeReceivingCandidates } from "@/actions/platformFees";
import { getAccess } from "@/lib/data/access";
import { can } from "@/lib/access";

export const metadata = { title: "Investors" };

/**
 * Investor set-up: the register, agreements with their charge rules, and which
 * routers each investor owns.
 *
 * SYSADMIN does everything. A company admin sees the investors linked to their
 * company and assigns or releases their company's routers.
 */
export default async function InvestorsPage({ searchParams }: { searchParams: Promise<{ manage?: string; month?: string }> }) {
  const { manage, month: requestedMonth } = await searchParams;
  // ?month=YYYY-MM shows that statement month; anything else shows what is owed now
  const month = requestedMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth) ? requestedMonth : null;
  const access = await getAccess();
  const isPlatformAdmin = access.superAdmin;
  // the investor register: the super admin manages it, roles granted it (company admin) read it
  const isCompanyAdmin = !isPlatformAdmin && can(access, "API_INVESTORREGISTRY_ROOT", "VIEW");
  if (!isPlatformAdmin && !isCompanyAdmin) redirect("/dashboard");

  // "Manage agreements and routers" on an investor's page lands here with ?manage=<id>
  const [investors, statementMonths, devices, owned, feeBalances, receivingCandidates, managed] = await Promise.all([
    listInvestors(month),
    listStatementMonths(),
    getMikrotikDevices(),
    listRouterAssignments({ currentOnly: true }),
    getFeeBalances(),
    isPlatformAdmin ? getFeeReceivingCandidates() : Promise.resolve([]),
    manage ? getInvestor(manage) : Promise.resolve(null),
  ]);
  const feeAccount = isPlatformAdmin ? await getFeeReceivingAccount() : null;
  const ownerOf = new Map(owned.map((a) => [a.routerId, `${a.investorName} (${a.investorCode})`]));
  const routers: RouterOption[] = (devices.data ?? [])
    .map((d) => ({
      id: d.id,
      name: d.name,
      detail: [d.site || d.location, d.ipAddress].filter(Boolean).join(" · "),
      online: d.online,
      owner: ownerOf.get(d.id) ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <InvestorsClient investors={investors} routers={routers} isPlatformAdmin={isPlatformAdmin} initialDetail={managed?.success ? managed.data : null} feeAccount={feeAccount} month={month} statementMonths={statementMonths} />
      <SystemFeesLedger
        balances={feeBalances}
        canRecordPayment={isPlatformAdmin}
        receivingCandidates={receivingCandidates}
      />
    </>
  );
}
