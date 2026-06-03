import { getRolesAction } from "@/actions/roles";
import { getSystemUsers } from "@/actions/system";
import { Suspense } from "react";
import StaffUsersClient from "./_components/StaffUsersClient";
import { Skeleton } from "@/components/ui/skeleton";

async function StaffUsersPage() {
  const [users, rolesRes] = await Promise.all([
    getSystemUsers(),
    getRolesAction(),
  ]);

  const roles = rolesRes?.data ?? [];



  return <StaffUsersClient users={users} roles={roles} />;
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <StaffUsersPage />
    </Suspense>
  );
}

function PageSkeleton() {
  return (
    <div className="p-8 pt-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
      </div>
      <Skeleton className="h-px w-full" />
      <Skeleton className="h-100 w-full rounded-xl" />
    </div>
  );
}
