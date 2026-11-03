import type { Metadata } from "next";
import { AccountNumberForm } from "./_components/AccountNumberForm";

export const metadata: Metadata = { title: "Renew my internet" };

/** Public: a PPPoE customer enters their account number (e.g. BDK0069) to renew. */
export default function RenewPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold text-foreground">Renew my internet</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your account number. You find it in our text messages, for example BDK0069.
      </p>
      <AccountNumberForm />
    </main>
  );
}
