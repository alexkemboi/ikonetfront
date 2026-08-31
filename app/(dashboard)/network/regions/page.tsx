import { getRegions } from "@/actions/network";
import { RegionClient } from "./_components/RegionClient";

export const metadata = {
 title: "Region Management - IBS",
 description: "Manage ISP infrastructure regions",
};

export default async function RegionsPage() {
 const initialRegions = await getRegions(false);

return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
            Network — Regions
          </p>
          <h1 className="text-3xl font-serif font-semibold text-foreground">Regions.</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Define and manage your high-level geographic ISP operation boundaries.
          </p>
        </div>

        <RegionClient initialRegions={initialRegions} />
      </div>
    </div>
  );
}