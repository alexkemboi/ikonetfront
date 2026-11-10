'use server';

/**
 * A crash in the captive portal, reported by the customer's browser. The phone's sign-in window
 * has no console anyone can read, so the message, the browser (its version decides which
 * JavaScript it runs) and the page go to this server's log: grep "[PORTAL-ERROR]".
 */
export async function reportPortalErrorAction(report: {
  message?: string;
  digest?: string;
  userAgent?: string;
  page?: string;
}): Promise<void> {
  const clip = (value: string | undefined, max: number) => (value ?? '').replace(/\s+/g, ' ').slice(0, max);
  // the page address carries the router's mac/ip/rid: kept to the path for the log
  let page = '';
  try {
    page = report.page ? new URL(report.page).pathname : '';
  } catch {
    page = '';
  }
  console.error(
    `[PORTAL-ERROR] message="${clip(report.message, 300)}" digest=${clip(report.digest, 40) || '-'} ` +
      `page=${clip(page, 100)} ua="${clip(report.userAgent, 200)}"`
  );
}
