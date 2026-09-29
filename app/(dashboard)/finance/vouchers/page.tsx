import type { Metadata } from "next";
import { VouchersClient } from "@/components/vouchers/VouchersClient";
import { getVouchersData } from "@/actions/vouchers";
import { getVoucherBatches } from "@/actions/payments";
import { getActiveHotspotPackagesAction } from "@/actions/packages";
import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vouchers & Prepaid Codes | IBS Platform",
  description: "Prepaid voucher minting and batch distribution",
};

export default async function VouchersPage({ searchParams }: { searchParams: Promise<{ page?: string; batchPage?: string; search?: string; voucherState?: string; source?: string }> }) {
  const pagePerms = await getPermissionForRoute("/finance/vouchers");
  if (!pagePerms.canView) redirect("/dashboard");

  const query = await searchParams;
  const voucherStates = ["UNUSED", "USED", "EXPIRED", "VOID", "PENDING", "FAILED"] as const;
  const voucherState = voucherStates.includes(query.voucherState as typeof voucherStates[number]) ? query.voucherState as typeof voucherStates[number] : "ALL";
  const source = query.source === "MINTED" || query.source === "PURCHASED" ? query.source : "ALL";
  const data = await getVouchersData({ page: Math.max(0, Number(query.page ?? 0) || 0), size: 20, search: query.search, voucherState, source });
  const batches = await getVoucherBatches(Math.max(0, Number(query.batchPage ?? 0) || 0), 50);
  const packages = await getActiveHotspotPackagesAction();
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
      batchKpis={batches.kpis}
      batches={batches.batches}
      batchPage={batches.page}
      packageOptions={packageOptions}
      page={data.page}
      voucherState={voucherState}
      search={query.search ?? ""}
      source={source}
      voucherError={data.error}
      requestId={data.requestId}
      batchError={batches.error}
      batchRequestId={batches.requestId}
    />
  );
}