import { getRegions } from "@/actions/network";
import { LocationClient } from "./_components/LocationClient";

export const metadata = {
 title: "Location Management - IBS",
 description: "Manage ISP infrastructure locations (POPs/sites)",
};

export default async function LocationsPage() {
 const regionsTree = await getRegions(true);
return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
            Network — Locations
          </p>
          <h1 className="text-3xl font-sans font-normal text-foreground">Locations.</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage POPs, exchanges, and physical sites within each region.
          </p>
        </div>

        <LocationClient regionsTree={regionsTree} />
      </div>
    </div>
  );
}