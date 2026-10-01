import type { Metadata } from "next";
import { VouchersClient } from "@/components/vouchers/VouchersClient";
import { getVouchersData } from "@/actions/vouchers";
import { getVoucherBatches } from "@/actions/payments";
import { getPackagesAction } from "@/actions/packages";
import { getMikrotikDevices } from "@/actions/mikrotik";
import { getPermissionForRoute } from "@/lib/data/nav";
import type { VoucherStatus } from "@/lib/types/vouchers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vouchers & Prepaid Codes | IBS Platform",
  description: "Prepaid voucher minting and batch distribution",
};

const VOUCHER_STATES: Array<"ALL" | VoucherStatus> = ["ALL", "UNUSED", "USED", "EXPIRED", "VOID", "PENDING", "FAILED"];
const SOURCES = ["ALL", "MINTED", "PURCHASED"] as const;

export default async function VouchersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    batchPage?: string;
    search?: string;
    voucherState?: string;
    source?: string;
  }>;
}) {
  const pagePerms = await getPermissionForRoute("/finance/vouchers");
  if (!pagePerms.canView) redirect("/dashboard");

  const params = await searchParams;
  const page = Math.max(0, Number(params.page ?? 0) || 0);
  const batchPage = Math.max(0, Number(params.batchPage ?? 0) || 0);
  const voucherState = (VOUCHER_STATES.includes(params.voucherState as "ALL" | VoucherStatus)
    ? params.voucherState
    : "ALL") as "ALL" | VoucherStatus;
  const source = (SOURCES.includes(params.source as (typeof SOURCES)[number]) ? params.source : "ALL") as
    | "ALL"
    | "MINTED"
    | "PURCHASED";

  // Row filters go to the list endpoint only; statistics stays unfiltered by state.
  const data = await getVouchersData({
    page,
    size: 50,
    search: params.search,
    voucherState: voucherState === "ALL" ? undefined : voucherState,
    source: source === "ALL" ? undefined : source,
  });
  const batches = await getVoucherBatches(batchPage);
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
        .filter((p) => p.activeStatus === true)
        .map((p) => ({
          value: String(p.idxno),
          label: `${p.packageName} · KES ${p.price}`,
          unitPrice: String(p.price),
        }))
    : [];

  return (
    <VouchersClient
      initialKpis={data.kpis}
      initialVouchers={data.vouchers}
      kpiError={data.error}
      batchKpis={batches.kpis ?? undefined}
      batches={batches.batches}
      batchPage={batches.page}
      packageOptions={packageOptions}
      routerOptions={routerOptions}
      voucherPage={data.page}
      voucherState={voucherState}
      search={params.search ?? ""}
      source={source}
    />
  );
}