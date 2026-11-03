import type { Metadata } from "next";
import Link from "next/link";
import { getPppoeRenewalInfoAction } from "@/actions/pppoeRenewal";
import { RenewFlow } from "../_components/RenewFlow";

export const metadata: Metadata = { title: "Renew my internet" };
export const dynamic = "force-dynamic";

/** Public: one PPPoE account's package, price and expiry, and an M-Pesa prompt to renew it. */
export default async function RenewAccountPage({ params }: { params: Promise<{ accountNumber: string }> }) {
  const { accountNumber } = await params;
  const res = await getPppoeRenewalInfoAction(accountNumber);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold text-foreground">Renew my internet</h1>
      {res.success && res.data ? (
        <RenewFlow info={res.data} />
      ) : (
        <div className="mt-6 space-y-3">
          <p role="alert" className="text-sm text-destructive">
            {res.status === 429 ? "Too many tries just now. Wait a minute and try again." : "We could not find that account number."}
          </p>
          <Link href="/renew" className="text-sm font-medium text-primary underline">Enter it again</Link>
        </div>
      )}
    </main>
  );
}
