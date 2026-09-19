"use client";

const OPEN_EVENT = "omni-search:open";

/** Opens the global Ctrl+K modal (used by the TopBar search trigger). */
export function openOmniSearch(): void {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

/** Subscribes a handler to the modal-open event. Returns unsubscribe. */
export function listenOmniSearch(handler: () => void): () => void {
  const listener = () => handler();
  window.addEventListener(OPEN_EVENT, listener);
  return () => window.removeEventListener(OPEN_EVENT, listener);
}