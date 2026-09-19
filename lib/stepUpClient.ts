"use client";

/**
 * Module-level bridge between the imperatively-used `requestStepUp()` helper
 * (lib/stepUp.ts, called from client event handlers) and the StepUpProvider
 * React boundary that owns the modal + memory-only token cache.
 */

export type StepUpWaiter = {
  open: (reason?: string) => Promise<string | null>;
};

let waiter: StepUpWaiter | null = null;

export function registerStepUpWaiter(next: StepUpWaiter | null): void {
  waiter = next;
}

export function requestStepUp(reason?: string): Promise<string | null> {
  if (!waiter) {
    return Promise.resolve(null);
  }
  return waiter.open(reason);
}