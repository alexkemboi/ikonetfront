import { describe, expect, it } from "vitest";
import type { RouterLanHealth } from "@/lib/types/lanHealth";
import {
  lanProblemSentence, routersThatCannotSignIn, routersWithDhcpAlarm, routersWithWrongAddresses, signInLabel, timeAgo,
} from "@/lib/utils/lanHealth";

const base: RouterLanHealth = {
  routerId: 90, routerName: "ADRINOLD-WESTLANDS", companyId: "CMP-ADR-001", status: "OK", checkedAt: "2026-10-13T09:00:00Z",
  error: null, devicesOnHotspot: 40, devicesOnWrongAddress: 0, unauthorisedDhcpServers: 0,
  accessPointsSeen: 16, accessPointsNotSeen: 0, notSeenAfterMinutes: 15,
  signInStatus: "WORKING", signInAnswered: 12, signInUnanswered: 0, signInNote: null, signInWindowMinutes: 10,
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

  it("flags a router whose sign-in requests all go unanswered, even when it looks healthy otherwise", () => {
    const deaf = { ...base, status: "ATTENTION" as const, signInStatus: "NOT_WORKING" as const, signInAnswered: 0, signInUnanswered: 5 };
    expect(routersThatCannotSignIn([base, deaf])).toEqual([deaf]);
    expect(signInLabel(deaf)).toBe("Not working");
    expect(lanProblemSentence(deaf)).toBe(
      "5 sign-in requests in the last 10 minutes got no answer and none was answered. Customers who pay here are not connected."
    );
  });

  it("does not flag quiet routers or routers that could not be read", () => {
    const quiet = { ...base, signInStatus: "NO_ATTEMPTS" as const };
    const blind = { ...base, status: "UNKNOWN" as const, signInStatus: "NOT_WORKING" as const };
    expect(routersThatCannotSignIn([quiet, blind])).toEqual([]);
    expect(signInLabel(quiet)).toBe("No one tried lately");
  });
});
