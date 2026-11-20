import { getRolesAction } from "@/actions/roles";
import { getSystemUsersPage } from "@/actions/system";
import { getInvestorOptions } from "@/actions/investor";
import { Suspense } from "react";
import StaffUsersClient from "./_components/StaffUsersClient";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUserPermissions, NO_PERMISSIONS } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isPlatformAdminRole, normalizeRole, ROLE_NAME } from "@/lib/types/roles";

export const metadata = { title: "User Administration — SpeedLink" };

async function StaffUsersPage() {
 const permissions = await getCurrentUserPermissions();
 const pagePerms = permissions["/system/users"] ?? NO_PERMISSIONS;
 if (!pagePerms.canView) redirect("/dashboard");

 const [usersRes, rolesRes, session, investors] = await Promise.all([
 getSystemUsersPage({ page: 0, size: 20 }),
 getRolesAction(),
 auth(),
 getInvestorOptions(),
 ]);

 const roles = rolesRes?.data ?? [];
 if (!usersRes.success || !usersRes.data) {
   return (
     <div className="p-8 text-sm text-destructive">
       Failed to load system users: {usersRes.message}
     </div>
   );
 }

 return (
   <StaffUsersClient
     initialPage={usersRes.data}
     roles={roles}
     isPlatformAdmin={isPlatformAdminRole(session?.user?.role)}
     canManageUsers={normalizeRole(session?.user?.role) === ROLE_NAME.ADMIN}
     investors={investors}
   />
 );
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
