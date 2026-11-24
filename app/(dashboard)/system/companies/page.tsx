import { getAccess } from "@/lib/data/access";
import { can } from "@/lib/access";
import { redirect } from "next/navigation";
import { getPaymentReadiness, listCompanies } from "@/actions/companies";
import CompaniesClient from "./_components/CompaniesClient";

export const metadata = { title: "Companies — SpeedLink" };

export default async function CompaniesPage() {
  // shown to roles that may read the companies; only those that may create one change them
  const access = await getAccess();
  if (!can(access, "API_COMPANY_ROOT", "VIEW")) redirect("/dashboard");

  const [companies, readiness] = await Promise.all([listCompanies(), getPaymentReadiness()]);
  const canMutate = can(access, "API_COMPANY_ROOT", "CREATE");

  return <CompaniesClient companies={companies} readiness={readiness} canMutate={canMutate} />;
}