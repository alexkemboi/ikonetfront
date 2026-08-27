import { getRegions } from "@/actions/network";
import { OnboardingWizard } from "./_components/OnboardingWizard";

export const metadata = {
  title: "Onboard Network Router - IBS",
  description: "Connect and provision a new MikroTik RouterOS device",
};

export default async function OnboardRouterPage() {
  const regionsTree = await getRegions(true);

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Onboard Edge Device</h1>
        <p className="text-muted-foreground">
          Connect, validate, locate, and automatically provision a new MikroTik RouterOS device.
        </p>
      </div>

      <OnboardingWizard regionsTree={regionsTree} />
    </div>
  );
}