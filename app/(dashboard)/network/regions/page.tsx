import { getRegions } from "@/actions/network";
import { RegionClient } from "./_components/RegionClient";

export const metadata = {
 title: "Region Management - IBS",
 description: "Manage ISP infrastructure regions",
};

export default async function RegionsPage() {
 const initialRegions = await getRegions(false);

 return (
 <div className="space-y-6 p-6">
 <div className="flex flex-col gap-2">
 <h1 className="text-3xl font-bold tracking-tight">Regions</h1>
 <p className="text-muted-foreground">
 Define and manage your high-level geographic ISP operation boundaries.
 </p>
 </div>

 <RegionClient initialRegions={initialRegions} />
 </div>
 );
}