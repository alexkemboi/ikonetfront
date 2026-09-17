import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listCompanies } from "@/actions/companies";
import CompaniesClient from "./_components/CompaniesClient";

export const metadata = { title: "Companies — Beesmart" };

export default async function CompaniesPage() {
  const session = await auth();
  const rawRole = session?.user?.role ?? "";
  const isAdmin = /^(SYSADMIN|ROLE_SYSADMIN|SUPER_ADMIN|ADMIN|ROLE_ADMIN|01)$/i.test(rawRole.trim());
  if (!isAdmin) redirect("/dashboard");

  const companies = await listCompanies();
  const canMutate = /SYSADMIN|ROLE_SYSADMIN|SUPER_ADMIN/i.test(rawRole);

  return <CompaniesClient companies={companies} canMutate={canMutate} />;
}