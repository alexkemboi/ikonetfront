import { redirect } from "next/navigation";

/** Access Control is now the Roles & Permissions tab of Users & Access Control. */
export default function AccessControlMoved() {
  redirect("/system/users/roles");
}
