import { redirect } from "next/navigation";
import { getSignInActivity } from "@/actions/usersAccess";
import { getUsersAccessRights } from "../_lib/access";
import { SignInEventsTable } from "../_components/SignInEventsTable";

export const metadata = { title: "Sign-in Activity — Users & Access Control" };

export default async function SignInActivityPage() {
  const rights = await getUsersAccessRights();
  if (!rights.viewUsers) redirect("/system/users");
  const initial = await getSignInActivity({ page: 0, size: 25 });
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Sign-ins, failed attempts, lockouts, sign-outs and administrator actions on sessions. Failed sign-ins and
        lockouts are always recorded; successful sign-ins only while your security settings say so.
      </p>
      <SignInEventsTable initial={initial.success ? initial.data : null} load={getSignInActivity} showUser searchable />
    </div>
  );
}
