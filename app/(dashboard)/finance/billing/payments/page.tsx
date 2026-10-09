import type { Metadata } from "next";
import { getPaymentsLedgerData } from "@/actions/payments";
import { listRefunds } from "@/actions/refunds";
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
    const [data, session, voucherPerms, paymentPerms, refunds] = await Promise.all([
        getPaymentsLedgerData(),
        auth(),
        getPermissionForRoute("/finance/vouchers"),
        getPermissionForRoute("/finance/billing/payments"),
        listRefunds(),
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
            // Refunds: raised by those who may create on Payments, confirmed as paid
            // back by those who may edit; the backend enforces the same.
            canRefund={!isStaff && paymentPerms.canCreate}
            canProcessRefund={!isStaff && paymentPerms.canEdit}
            refunds={refunds}
        />
    );
}
