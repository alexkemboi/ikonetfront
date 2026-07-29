import { getRouters } from "@/actions/network";
import { RouterInventoryClient } from "./_components/RouterInventoryClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata = {
  title: "Router Fleet Inventory - IBS",
};

export default async function RoutersPage() {
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

        <Button asChild className="flex items-center gap-2">
          <Link href="/network/routers/onboard">
            <Plus className="h-4 w-4" /> Onboard Edge Device
          </Link>
        </Button>
      </div>

      <RouterInventoryClient initialRouters={routers} />
    </div>
  );
}