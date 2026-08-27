import { getRegions } from "@/actions/network";
import { StationClient } from "./_components/StationClient";

export const metadata = {
 title: "Station Management - IBS",
 description: "Manage ISP physical Point of Presence (POPs)",
};

export default async function StationsPage() {
 const regionsTree = await getRegions(true);

 return (
 <div className="space-y-6 p-6">
 <div className="flex flex-col gap-2">
 <h1 className="text-3xl font-bold tracking-tight">Stations (POPs)</h1>
 <p className="text-muted-foreground">
 Onboard and manage physical cabinet sites, power profiles, and backhaul links.
 </p>
 </div>
 <StationClient regionsTree={regionsTree} />
 </div>
 );
}