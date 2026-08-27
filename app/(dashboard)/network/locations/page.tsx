import { getRegions } from "@/actions/network";
import { LocationClient } from "./_components/LocationClient";

export const metadata = {
 title: "Location Management - IBS",
 description: "Manage ISP infrastructure locations (POPs/sites)",
};

export default async function LocationsPage() {
 const regionsTree = await getRegions(true);
 return (
 <div className="space-y-6 p-6">
 <div className="flex flex-col gap-2">
 <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
 <p className="text-muted-foreground">
 Manage POPs, exchanges, and physical sites within each region.
 </p>
 </div>
 <LocationClient regionsTree={regionsTree} />
 </div>
 );
}