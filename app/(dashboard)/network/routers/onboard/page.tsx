import { getRegions } from "@/actions/network";
import { getPermissionForRoute } from "@/lib/data/nav";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "./_components/OnboardingWizard";

export const metadata = {
  title: "Onboard Network Router - IBS",
  description: "Connect and provision a new MikroTik RouterOS device",
};

export const dynamic = "force-dynamic";

export default async function OnboardRouterPage() {
  // Strict RBAC: the backend gates validate-connectivity + onboard behind
  // SYSADMIN/ADMIN/01/02. Reflect that on the UI so staff/investor/customer
  // never sees a wizard that would 403.
  const pagePerms = await getPermissionForRoute("/network/routers/onboard");
  if (!pagePerms.canView) redirect("/dashboard");

  const session = await auth();
  const role = session?.user?.role;
  const isPlatformAdmin = role === "SYSADMIN" || role === "ADMIN";
  const companyScope = session?.user?.companyScope;

  const regionsResult = await getRegions(true);
  if (!regionsResult.success && regionsResult.status === 401) redirect("/signout?reason=session-expired");
  const regionsTree = regionsResult.success ? regionsResult.data : [];

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-normal tracking-normal">Onboard Edge Device</h1>
        <p className="text-muted-foreground">
          Connect, validate, locate, and automatically provision a new MikroTik RouterOS device.
        </p>
      </div>

      {!regionsResult.success && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">Region data unavailable: {regionsResult.message}{regionsResult.requestId ? ` · Ref: ${regionsResult.requestId}` : ""}</p>}

      <OnboardingWizard
        regionsTree={regionsTree}
        companyScope={companyScope}
        isPlatformAdmin={isPlatformAdmin}
      />
    </div>
  );
}