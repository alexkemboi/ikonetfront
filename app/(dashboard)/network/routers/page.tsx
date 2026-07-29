import { getRouters } from "@/actions/network";
import { RouterInventoryClient } from "./_components/RouterInventoryClient";
import { getCurrentUserPermissions, NO_PERMISSIONS } from "@/lib/data/nav";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Router Fleet Inventory - IBS",
};

export default async function RoutersPage() {
  const permissions = await getCurrentUserPermissions();
  const pagePerms = permissions["/network/routers"] ?? NO_PERMISSIONS;
  if (!pagePerms.canView) redirect("/dashboard");

  const routers = await getRouters();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Router Fleet</h1>
          <p className="text-muted-foreground">
            Manage deployed edge hardware, monitor active sessions, and provision new gateways.
          </p>
        </div>
      </div>

      <RouterInventoryClient initialRouters={routers} />
    </div>
  );
}