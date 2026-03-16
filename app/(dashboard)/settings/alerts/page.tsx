import AlertsClient from "./_components/AlertsClient";
import { getProvidersAction } from "@/actions/alerts";

export const metadata = { title: "Alert Channels — Beesmart" };

export default async function AlertsPage() {
  const result   = await getProvidersAction();
  const providers = result.success ? result.data : [];

  return (
    <div className="p-6">
      <AlertsClient providers={providers} activeChannels={[]} />
    </div>
  );
}
