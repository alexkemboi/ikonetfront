import type { Metadata } from "next";
import { VouchersClient } from "@/components/vouchers/VouchersClient";
import { getVouchersData } from "@/actions/vouchers";
import { getVoucherBatches } from "@/actions/payments";
import { getPackagesAction } from "@/actions/packages";
import { getMikrotikDevices } from "@/actions/mikrotik";
import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vouchers & Prepaid Codes | IBS Platform",
  description: "Prepaid voucher minting and batch distribution",
};

export default async function VouchersPage() {
  const pagePerms = await getPermissionForRoute("/finance/vouchers");
  if (!pagePerms.canView) redirect("/dashboard");

  const data = await getVouchersData();
  const batches = await getVoucherBatches();
  const packages = await getPackagesAction();
  const devices = await getMikrotikDevices();
  // Vouchers are minted per router and are redeemable only on it.
  const routerOptions = devices.success && Array.isArray(devices.data)
    ? devices.data
        .filter((d) => d.active && d.deviceType?.toUpperCase() === "MIKROTIK")
        .map((d) => ({
          value: String(d.id),
          label: d.site ? `${d.name} · ${d.site}` : d.name,
        }))
    : [];
  const packageOptions = packages.success && Array.isArray(packages.data)
    ? packages.data
        .filter((p) => p.activeStatus === true && p.price > 0)
        .map((p) => ({
          value: String(p.idxno),
          label: `${p.packageName} · Ksh ${p.price}`,
        }))
    : [];

  return (
    <VouchersClient
      initialKpis={data.kpis}
      initialVouchers={data.vouchers}
      batchKpis={batches.kpis}
      batches={batches.batches}
      packageOptions={packageOptions}
      routerOptions={routerOptions}
    />
  );
}