import type { Metadata } from "next";
import { getPaymentsLedgerData } from "@/actions/payments";
import { listRefunds } from "@/actions/refunds";
import { PaymentsLedgerView } from "@/components/payments/PaymentsLedgerView";
import { auth } from "@/lib/auth";
import { getPermissionForRoute } from "@/lib/data/nav";
import { getAccess } from "@/lib/data/access";
import { can } from "@/lib/access";

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
    const access = await getAccess();
    // what the API lets this role do: record a manual payment, issue a compensation voucher
    const canRecord = can(access, "API_MANUALPAYMENT", "CREATE");
    const canCompensate = can(access, "API_HOTSPOT", "CREATE");

    return (
        <PaymentsLedgerView
            kpis={data.kpis}
            payments={data.payments}
            source={data.source}
            canRecordPayment={canRecord}
            canIssueVoucher={canCompensate && voucherPerms.canCreate}
            // Refunds: raised by those who may create on Payments, confirmed as paid
            // back by those who may edit; the backend enforces the same.
            canRefund={can(access, "API_REFUND_ROOT", "CREATE") && paymentPerms.canCreate}
            canProcessRefund={can(access, "API_REFUND_PROCESS", "CREATE") && paymentPerms.canEdit}
            refunds={refunds}
            // the summary cards live on Finance › Payments; Billing is the working list
            showSummary={false}
        />
    );
}
