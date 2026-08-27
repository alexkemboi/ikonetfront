
import { MikrotikClient } from "./_components/MikrotikClient";
import { getMikrotikDevices } from "@/actions/mikrotik";
// import { MikrotikDevice } from "@/lib/types/mikrotik"; // Removed as it's not used

export default async function MikrotikPage() {
  const { data: devices } = await getMikrotikDevices();

  return (
    <div className="container mx-auto px-10 py-10">
      <MikrotikClient initialDevices={devices || []} />
    </div>
  );
}
