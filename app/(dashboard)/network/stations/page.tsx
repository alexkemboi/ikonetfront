import { getRegions } from "@/actions/network";
import { StationClient } from "./_components/StationClient";
import { redirect } from "next/navigation";

export const metadata = {
 title: "Station Management - IBS",
 description: "Manage ISP physical Point of Presence (POPs)",
};

export default async function StationsPage() {
 const result = await getRegions(true);
 if (!result.success && result.status === 401) redirect("/signout?reason=session-expired");
 const regionsTree = result.success ? result.data : [];

return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
            Network — Stations
          </p>
          <h1 className="text-3xl font-sans font-normal text-foreground">Stations (POPs).</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Onboard and manage physical cabinet sites, power profiles, and backhaul links.
          </p>
        </div>

        {!result.success && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">Region data unavailable: {result.message}{result.requestId ? ` · Ref: ${result.requestId}` : ""}</p>}

        <StationClient regionsTree={regionsTree} />
      </div>
    </div>
  );
}