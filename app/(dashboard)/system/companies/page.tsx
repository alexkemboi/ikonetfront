import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPaymentReadiness, listCompanies } from "@/actions/companies";
import CompaniesClient from "./_components/CompaniesClient";

export const metadata = { title: "Companies — Beesmart" };

export default async function CompaniesPage() {
  const session = await auth();
  const rawRole = session?.user?.role ?? "";
  const isOperator = /^(SYSADMIN|ROLE_SYSADMIN|SUPER_ADMIN|ADMIN|ROLE_ADMIN|01|02|03)$/i.test(rawRole.trim());
  if (!isOperator) redirect("/dashboard");

  const [companies, readiness] = await Promise.all([listCompanies(), getPaymentReadiness()]);
  const canMutate = /SYSADMIN|ROLE_SYSADMIN|SUPER_ADMIN/i.test(rawRole);

  return <CompaniesClient companies={companies} readiness={readiness} canMutate={canMutate} />;
}