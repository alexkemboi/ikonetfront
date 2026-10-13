import { describe, expect, it } from "vitest";
import type { RouterLanHealth } from "@/lib/types/lanHealth";
import { lanProblemSentence, routersWithDhcpAlarm, routersWithWrongAddresses, timeAgo } from "@/lib/utils/lanHealth";

const base: RouterLanHealth = {
  routerId: 90, routerName: "ADRINOLD-WESTLANDS", companyId: "CMP-ADR-001", status: "OK", checkedAt: "2026-10-13T09:00:00Z",
  error: null, devicesOnHotspot: 40, devicesOnWrongAddress: 0, unauthorisedDhcpServers: 0,
  accessPointsSeen: 16, accessPointsNotSeen: 0, notSeenAfterMinutes: 15,
};

describe("customer network health helpers", () => {
  it("raises the alarm only for routers with another DHCP server", () => {
    const sick = { ...base, status: "ATTENTION" as const, unauthorisedDhcpServers: 23, devicesOnWrongAddress: 34 };
    expect(routersWithDhcpAlarm([base, sick])).toEqual([sick]);
    expect(lanProblemSentence(sick)).toBe(
      "23 devices are handing out addresses that only the router should give, and 34 customer devices have a wrong address."
    );
  });

  it("reports wrong addresses separately when no DHCP server was caught", () => {
    const odd = { ...base, status: "ATTENTION" as const, devicesOnWrongAddress: 1 };
    expect(routersWithWrongAddresses([base, odd])).toEqual([odd]);
    expect(lanProblemSentence(odd)).toBe("1 customer device has an address the router did not give out.");
  });

  it("never alarms on a router that could not be read", () => {
    const blind = { ...base, status: "UNKNOWN" as const, unauthorisedDhcpServers: 5, devicesOnWrongAddress: 9 };
    expect(routersWithDhcpAlarm([blind])).toEqual([]);
    expect(lanProblemSentence(blind)).toBeNull();
  });

  it("mentions silent access points when nothing worse is wrong", () => {
    expect(lanProblemSentence({ ...base, status: "ATTENTION", accessPointsNotSeen: 2 })).toBe(
      "2 access points have not been seen for over 15 minutes."
    );
    expect(lanProblemSentence(base)).toBeNull();
  });

  it("says how long ago in plain words", () => {
    const now = new Date("2026-10-13T09:04:00Z").getTime();
    expect(timeAgo("2026-10-13T09:00:00Z", now)).toBe("4 min ago");
    expect(timeAgo("2026-10-13T06:00:00Z", now)).toBe("3h ago");
    expect(timeAgo(null, now)).toBe("never");
  });
});
