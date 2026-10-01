import { getRegions } from "@/actions/network";
import { RegionClient } from "./_components/RegionClient";
import { redirect } from "next/navigation";

export const metadata = {
 title: "Region Management - IBS",
 description: "Manage ISP infrastructure regions",
};

export default async function RegionsPage() {
 const result = await getRegions(false);
 if (!result.success && result.status === 401) redirect("/signout?reason=session-expired");
 const initialRegions = result.success ? result.data : [];

return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
            Network — Regions
          </p>
          <h1 className="text-3xl font-sans font-normal text-foreground">Regions.</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Define and manage your high-level geographic ISP operation boundaries.
          </p>
        </div>

        {!result.success && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">Regions unavailable: {result.message}{result.requestId ? ` · Ref: ${result.requestId}` : ""}</p>}

        <RegionClient initialRegions={initialRegions} />
      </div>
    </div>
  );
}