import { getPackagesAction } from "@/actions/packages";
import PackagesClient from "./_components/PackagesClient";

export const metadata = {
  title: "Internet Packages — Beesmart Billing",
};

export default async function InternetPackagesPage() {
  const result = await getPackagesAction();
  const packages = result.success ? (result.data ?? []) : [];

  return (
    <div className="p-6">
      <PackagesClient packages={packages} />
    </div>
  );
}
