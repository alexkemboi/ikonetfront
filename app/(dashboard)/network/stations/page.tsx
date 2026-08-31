import { getRegions } from "@/actions/network";
import { StationClient } from "./_components/StationClient";

export const metadata = {
 title: "Station Management - IBS",
 description: "Manage ISP physical Point of Presence (POPs)",
};

export default async function StationsPage() {
 const regionsTree = await getRegions(true);

return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
            Network — Stations
          </p>
          <h1 className="text-3xl font-serif font-semibold text-foreground">Stations (POPs).</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Onboard and manage physical cabinet sites, power profiles, and backhaul links.
          </p>
        </div>

        <StationClient regionsTree={regionsTree} />
      </div>
    </div>
  );
}