import { redirect } from "next/navigation";
import { getSecurityPolicy } from "@/actions/usersAccess";
import { getUsersAccessRights } from "../_lib/access";
import SecuritySettingsClient from "./_components/SecuritySettingsClient";

export const metadata = { title: "Security Settings — Users & Access Control" };

/**
 * The security policy of the organisation signed in to: a company administrator's own company; for
 * a platform administrator the company selected in the top bar, or the platform default when none is.
 */
export default async function SecuritySettingsPage() {
  const rights = await getUsersAccessRights();
  if (!rights.viewPolicy) redirect("/system/users");

  const res = await getSecurityPolicy();
  if (!res.success || !res.data) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        The security settings could not be loaded: {res.message}
      </div>
    );
  }
  const policy = res.data;
  const organisationLabel = policy.companyCode
    ? `organisation ${policy.companyCode}`
    : "the platform default (every organisation without its own settings, and platform administrators)";

  return <SecuritySettingsClient policy={policy} organisationLabel={organisationLabel} canEdit={rights.editPolicy} />;
}
