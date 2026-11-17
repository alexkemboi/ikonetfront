"use client";

import { PortalCrashScreen } from "@/components/portal/PortalCrashScreen";

export default function RenewError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PortalCrashScreen error={error} reset={reset} />;
}
