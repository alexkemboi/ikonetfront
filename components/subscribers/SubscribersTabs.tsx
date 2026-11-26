import { getCurrentUserPermissions } from "@/lib/data/nav";
import { SubscribersTabsNav } from "./SubscribersTabsNav";

/**
 * Subscribers: one sidebar menu for all subscribers (/customers) and PPPoE clients (/portal/pppoe).
 * Each tab follows its own page permission; with only one of them there is nothing to switch to,
 * so a customer whose portal dashboard is /portal/pppoe never sees the bar.
 */
export async function SubscribersTabs() {
  const permissions = await getCurrentUserPermissions();
  const tabs = [
    { href: "/customers", label: "All subscribers", show: permissions["/customers"]?.canView },
    { href: "/portal/pppoe", label: "PPPoE Clients", show: permissions["/portal/pppoe"]?.canView },
  ]
    .filter((tab) => tab.show)
    .map(({ href, label }) => ({ href, label }));

  if (tabs.length <= 1) return null;
  return <SubscribersTabsNav tabs={tabs} />;
}
