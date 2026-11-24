import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getRolesAction } from "@/actions/roles";
import { getInvestorOptions } from "@/actions/investor";
import { getOrganisationOptions, getSecurityPolicy, getUserDirectory, getUserSummary } from "@/actions/usersAccess";
import { Skeleton } from "@/components/ui/skeleton";
import UsersAccessClient from "./_components/UsersAccessClient";
import { getUsersAccessRights } from "./_lib/access";

export const metadata = { title: "Users & Access Control — SpeedLink" };

async function UsersPage() {
  const rights = await getUsersAccessRights();
  if (!rights.viewUsers) {
    // the merged menu also serves roles that could only open Access Control
    if (rights.roles.canView) redirect("/system/users/roles");
    if (rights.viewPolicy) redirect("/system/users/security");
    redirect("/dashboard");
  }

  const [directory, summary, rolesRes, investors, organisation, policy] = await Promise.all([
    getUserDirectory({ page: 0, size: 20 }),
    getUserSummary(),
    getRolesAction(),
    getInvestorOptions(),
    getOrganisationOptions(),
    rights.viewPolicy ? getSecurityPolicy() : Promise.resolve(null),
  ]);

  if (!directory.success || !directory.data) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        The users could not be loaded: {directory.message}
      </div>
    );
  }

  return (
    <UsersAccessClient
      initialPage={directory.data}
      initialSummary={summary.success ? summary.data : null}
      roles={rolesRes?.data ?? []}
      investors={investors}
      organisation={organisation.success ? organisation.data : null}
      isPlatformAdmin={rights.access.superAdmin}
      // without the policy (no right to read it) assume the default: a reset password is temporary
      requireChangeAfterReset={policy?.success && policy.data ? policy.data.requireChangeAfterReset : true}
      can={{
        createUsers: rights.createUsers && rights.menu.canCreate,
        editUsers: rights.editUsers,
        deleteUsers: rights.deleteUsers && rights.menu.canDelete,
        unlock: rights.unlock,
        resetPassword: rights.resetPassword,
        viewSessions: rights.viewSessions,
        endSessions: rights.endSessions,
        invite: rights.invite,
        manageInvitations: rights.manageInvitations,
        unlockAdministrators: rights.unlockAdministrators,
      }}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<UsersSkeleton />}>
      <UsersPage />
    </Suspense>
  );
}

function UsersSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading users">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-18 rounded-xl" />)}
      </div>
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
