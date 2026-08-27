import type { Metadata } from "next";
import { VouchersClient } from "@/components/vouchers/VouchersClient";
import { getVouchersData } from "@/actions/vouchers";
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
 return <VouchersClient initialKpis={data.kpis} initialVouchers={data.vouchers} />;
}