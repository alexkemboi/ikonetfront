import { getMyAlertSettings, getRecentStaffAlerts } from "@/actions/alerts-preferences";
import { MyAlertsClient } from "@/components/account/MyAlertsClient";
import { RecentStaffAlerts } from "@/components/account/RecentStaffAlerts";

export const metadata = { title: "My alerts" };

export default async function MyAlertsPage() {
  const [mine, recent] = await Promise.all([getMyAlertSettings(), getRecentStaffAlerts()]);

  return (
    <div className="space-y-6 p-6">
      <p className="max-w-3xl text-sm text-muted-foreground">
        The system tells you about what concerns your role: routers going down and coming back, tickets, payments that
        went wrong, system fees and, for platform admins, the platform itself. Switch off what you do not need.
      </p>
      {mine.data ? (
        <MyAlertsClient initial={mine.data} />
      ) : (
        <p className="text-sm text-destructive">{mine.message ?? "Your alert settings could not be loaded."}</p>
      )}
      {recent.allowed && <RecentStaffAlerts alerts={recent.data} />}
    </div>
  );
}
