"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { registerStepUpWaiter } from "@/lib/stepUpClient";
import StepUpModal from "@/components/chrome/StepUpModal";

const STEP_UP_TTL_MS = 10 * 60 * 1000;

type StepUpContextValue = {
  isElevated: boolean;
  expiresAt: Date | null;
  requestStepUp: (reason?: string) => Promise<string | null>;
  clear: () => void;
};

const StepUpContext = createContext<StepUpContextValue>({
  isElevated: false,
  expiresAt: null,
  requestStepUp: async () => null,
  clear: () => undefined,
});

export function useStepUp(): StepUpContextValue {
  return useContext(StepUpContext);
}

/**
 * Memory-only step-up session (Track 6 Phase 2). The token is held in React
 * state — NEVER persisted to localStorage/cookies — so a browser reload
 * terminates the elevation by construction.
 */
export default function StepUpProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingReason, setPendingReason] = useState<string | undefined>(undefined);
  const pendingResolver = useRef<((token: string | null) => void) | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  // Refresh the "now" tick so isElevated degrades without rendering impurity.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const verify = useCallback(async (password: string): Promise<string | null> => {
    const res = await apiFetch<{ token: string; expiresInSeconds: number; expiresAt: string }>(
      "/auth/step-up/verify",
      { method: "POST", body: { password }, auth: "required", cache: "no-store" }
    );
    if (!res.success || !res.data?.token) {
      return null;
    }
    setToken(res.data.token);
    setExpiresAt(new Date(Date.now() + STEP_UP_TTL_MS));
    return res.data.token;
  }, []);

  const open = useCallback(
    (reason?: string) => {
      setPendingReason(reason);
      setModalOpen(true);
      return new Promise<string | null>((resolve) => {
        pendingResolver.current = resolve;
      });
    },
    []
  );

  const requestStepUp = useCallback(
    async (reason?: string): Promise<string | null> => {
      if (token && expiresAt && expiresAt.getTime() > Date.now()) {
        return token;
      }
      return open(reason);
    },
    [token, expiresAt, open]
  );

  useEffect(() => {
    registerStepUpWaiter({ open });
    return () => registerStepUpWaiter(null);
  }, [open]);

  const dismiss = useCallback((cancelled: boolean) => {
    setModalOpen(false);
    setPendingReason(undefined);
    pendingResolver.current?.(cancelled ? null : "pending");
    pendingResolver.current = null;
  }, []);

  const handleVerified = useCallback((verifiedToken: string | null) => {
    setModalOpen(false);
    setPendingReason(undefined);
    pendingResolver.current?.(verifiedToken);
    pendingResolver.current = null;
  }, []);

  return (
    <StepUpContext.Provider
      value={{
        isElevated: Boolean(token && expiresAt && expiresAt.getTime() > now),
        expiresAt,
        requestStepUp,
        clear: () => {
          setToken(null);
          setExpiresAt(null);
        },
      }}
    >
      {children}
      <StepUpModal
        open={modalOpen}
        onVerify={verify}
        onVerified={handleVerified}
        onCancel={() => dismiss(true)}
        reason={pendingReason}
      />
    </StepUpContext.Provider>
  );
}