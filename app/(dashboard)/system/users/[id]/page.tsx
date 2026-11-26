import { notFound, redirect } from "next/navigation";
import { getRolesAction } from "@/actions/roles";
import { getInvestorOptions } from "@/actions/investor";
import {
  getOrganisationOptions,
  getUserAudit,
  getUserSecurityProfile,
  getUserSessions,
  getUserSignIns,
} from "@/actions/usersAccess";
import { getUsersAccessRights } from "../_lib/access";
import UserProfileClient from "./_components/UserProfileClient";

export const metadata = { title: "User details — Users & Access Control" };

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const rights = await getUsersAccessRights();
  if (!rights.viewUsers) redirect("/system/users");

  const profile = await getUserSecurityProfile(id);
  if (!profile.success || !profile.data) {
    if (profile.status === 404) notFound();
    return (
      <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        This user could not be loaded: {profile.message}
      </div>
    );
  }

  const [sessions, signIns, audit, rolesRes, investors, organisation] = await Promise.all([
    rights.viewSessions ? getUserSessions(id) : Promise.resolve(null),
    getUserSignIns(id, 0, 10),
    getUserAudit(id, 50),
    getRolesAction(),
    getInvestorOptions(),
    getOrganisationOptions(profile.data.user.companyId),
  ]);

  return (
    <UserProfileClient
      profile={profile.data}
      sessions={sessions?.success ? sessions.data ?? [] : null}
      signIns={signIns.success ? signIns.data : null}
      audit={audit.success ? audit.data ?? [] : null}
      roles={rolesRes?.data ?? []}
      investors={investors}
      organisation={organisation.success ? organisation.data : null}
      isPlatformAdmin={rights.access.superAdmin}
      can={{
        edit: rights.editUsers,
        changeRole: rights.changeRoles,
        unlock: rights.unlock,
        resetPassword: rights.resetPassword,
        viewSessions: rights.viewSessions,
        endSessions: rights.endSessions,
      }}
    />
  );
}
