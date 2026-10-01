import type { Metadata } from "next";
import { getPaymentsLedgerData } from "@/actions/payments";
import { PaymentsLedgerView } from "@/components/payments/PaymentsLedgerView";
import { auth } from "@/lib/auth";
import { getPermissionForRoute } from "@/lib/data/nav";
import { normalizeRole, ROLE_NAME } from "@/lib/types/roles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
 title: "Payments Ledger | IBS Platform",
 description: "Real-time M-Pesa transaction ledger and reconciliation",
};

export default async function PaymentsLedgerPage() {
 const [data, session, voucherPerms] = await Promise.all([
 getPaymentsLedgerData(),
 auth(),
 getPermissionForRoute("/finance/vouchers"),
 ]);
 // Staff (customer care) read payments only: the backend refuses them manual
 // payments (POST /payments/manual) and compensation vouchers.
 const isStaff = normalizeRole(session?.user?.role) === ROLE_NAME.STAFF;

 return (
 <PaymentsLedgerView
 kpis={data.kpis}
 payments={data.payments}
 source={data.source}
 canRecordPayment={!isStaff}
 canIssueVoucher={!isStaff && voucherPerms.canCreate}
 />
 );
}
