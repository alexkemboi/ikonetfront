import type { Metadata } from "next";
import { VoucherPrintSheet } from "@/components/vouchers/VoucherPrintSheet";
import { getVouchersData } from "@/actions/vouchers";
import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Voucher Print Sheet | IBS Platform",
  description: "A4 cut-grid print sheet of un-issued prepaid vouchers",
};

export default async function PrintPage() {
  const pagePerms = await getPermissionForRoute("/finance/vouchers");
  if (!pagePerms.canView) redirect("/dashboard");

  const { vouchers } = await getVouchersData();
  const unusedOnly = vouchers.filter(
    (v) => v.status === "UNUSED" && !v.isFallback
  );
  return <VoucherPrintSheet vouchers={unusedOnly} />;
}