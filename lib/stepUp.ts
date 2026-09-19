"use client";

import { requestStepUp } from "@/lib/stepUpClient";

/** Minimal result shape any protected server action returns. */
export type StepUpAwareResult = {
  success: boolean;
  status?: number;
  message: string;
};

/**
 * Client-side step-up retry (Track 6 Phase 2): runs the protected server
 * action; on HTTP 428 the operator re-authenticates once and the action is
 * replayed with the fresh `X-Step-Up-Token`. A second 428 surfaces as-is.
 */
export async function withStepUp<T extends StepUpAwareResult>(
  run: (token?: string) => Promise<T>,
  reason?: string
): Promise<T> {
  const first = await run();
  if (!first || first.status !== 428) {
    return first;
  }
  const token = await requestStepUp(reason);
  if (!token) {
    return first;
  }
  return run(token);
}