import Link from "next/link";
import { getCustomers } from "@/actions/customer";
import { getLiveSessionsData } from "@/actions/sessions";
import { CustomerClient } from "./_components/CustomerClient";
import { LiveSessionDataTable } from "@/components/sessions/LiveSessionDataTable";
import { HotspotSubscribers } from "./_components/HotspotSubscribers";
import { getPausedHotspotSessions } from "@/actions/subscriberTime";
import { getCurrentUserPermissions, NO_PERMISSIONS } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import type { SessionProtocol } from "@/lib/types/sessions";

export const dynamic = "force-dynamic";

export const metadata = {
 title: "Customer Directory — Ikonex Systems",
 description: "Every customer of the company: registered accounts, hotspot customers and TV customers.",
};

/**
 * Registered accounts (PPPoE and other customers with a login) are records in
 * the customer list. Hotspot and TV customers have no account: they exist as a
 * phone number on a paid session, so those views list paid, unexpired sessions.
 */
type DirectoryView = "accounts" | "hotspot" | "tv";

const SESSION_VIEWS: Record<Exclude<DirectoryView, "accounts">, { protocol: SessionProtocol; blurb: string }> = {
 hotspot: {
 protocol: "HOTSPOT",
 blurb: "Everyone with a hotspot package that is running or paused, shown by the phone number that paid. Use Manage to add time, pause or disconnect a customer.",
 },
 tv: {
 protocol: "TV",
 blurb: "TV and streaming devices with a paid, unexpired package.",
 },
};

/** Refresh cadence of the session views, matching Live Sessions. */
const REFRESH_INTERVAL_SECONDS = 30;

export default async function AllCustomersPage({
 searchParams,
}: {
 searchParams: Promise<{ view?: string }>;
}) {
 const permissions = await getCurrentUserPermissions();
 const pagePerms = permissions["/customers/all"] ?? NO_PERMISSIONS;
 if (!pagePerms.canView) redirect("/dashboard");

 const requested = (await searchParams).view;
 const view: DirectoryView = requested === "hotspot" || requested === "tv" ? requested : "accounts";

 const [firstPage, activeRes, pppoeRes, live, pausedRes] = await Promise.all([
 getCustomers(0, 10),
 getCustomers(0, 1, { isActive: true }),
 getCustomers(0, 1, { custtype: "pppoe" }),
 getLiveSessionsData(),
 getPausedHotspotSessions(),
 ]);
 const pausedSessions = pausedRes.success ? pausedRes.data : [];

 const sessionsOf = (protocol: SessionProtocol) => live.sessions.filter((s) => s.protocol === protocol);
 const accountsTotal = firstPage?.data?.totalElements ?? 0;
 const hotspotSessions = sessionsOf("HOTSPOT");
 const tvSessions = sessionsOf("TV");

 const tabs: { id: DirectoryView; label: string; count: number | null }[] = [
 { id: "accounts", label: "Registered accounts", count: accountsTotal },
 { id: "hotspot", label: "Hotspot customers", count: live.error ? null : hotspotSessions.length + pausedSessions.length },
 { id: "tv", label: "TV customers", count: live.error ? null : tvSessions.length },
 ];

 const sessionView = view === "accounts" ? null : SESSION_VIEWS[view];
 const sessions = view === "hotspot" ? hotspotSessions : tvSessions;

return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <nav className="flex gap-1 border-b border-border" aria-label="Customer type">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.id === "accounts" ? "/customers/all" : `/customers/all?view=${tab.id}`}
              aria-current={tab.id === view ? "page" : undefined}
              className={cn(
                "-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm transition-colors",
                tab.id === view
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                  {tab.count}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {sessionView === null ? (
          <CustomerClient
            initialTotalElements={accountsTotal}
            initialActiveCount={activeRes?.data?.totalElements ?? 0}
            initialPppoeCount={pppoeRes?.data?.totalElements ?? 0}
            initialHotspotCount={hotspotSessions.length}
            initialData={firstPage?.data?.content ?? []}
          />
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
                Customers — Directory
              </p>
              <h1 className="text-3xl font-sans font-normal text-foreground">
                {view === "hotspot" ? "Hotspot customers." : "TV customers."}
              </h1>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                {sessionView.blurb} The list updates every {REFRESH_INTERVAL_SECONDS} seconds.
              </p>
            </div>
            {live.error ? (
              <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm">
                <p className="font-medium">These customers could not be loaded. The list is not empty.</p>
                <p className="mt-1 text-muted-foreground">{live.error}</p>
              </div>
            ) : (
              view === "hotspot" ? (
                <HotspotSubscribers
                  sessions={hotspotSessions}
                  paused={pausedSessions}
                  pausedError={pausedRes.success ? undefined : pausedRes.message}
                  refreshIntervalSeconds={REFRESH_INTERVAL_SECONDS}
                />
              ) : (
                // Keyed by view so a switch starts from that view's own rows.
                <LiveSessionDataTable key={view} sessions={sessions} refreshIntervalSeconds={REFRESH_INTERVAL_SECONDS} />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
