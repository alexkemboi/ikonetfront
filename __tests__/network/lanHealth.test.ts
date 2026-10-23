import { describe, expect, it } from "vitest";
import type { RouterLanHealth } from "@/lib/types/lanHealth";
import {
  lanProblemSentence, routersThatCannotSignIn, routersWithCustomersOnWrongAddress, routersWithDhcpServersOnly,
  clockCorrectedSentence, clockLabel, clockOffsetLabel, passwordLabel, routersWithOldPassword, signInLabel,
  signInProblemSentence, timeAgo,
} from "@/lib/utils/lanHealth";
import { COLOUR_LEGEND, NETWORK_HEALTH_HELP } from "@/lib/help/networkHealthHelp";

const base: RouterLanHealth = {
  routerId: 90, routerName: "ADRINOLD-WESTLANDS", companyId: "CMP-ADR-001", status: "OK", checkedAt: "2026-10-13T09:00:00Z",
  error: null, devicesOnHotspot: 40, devicesOnWrongAddress: 0, unauthorisedDhcpServers: 0,
  accessPointsSeen: 16, accessPointsNotSeen: 0, notSeenAfterMinutes: 15,
  signInStatus: "WORKING", signInAnswered: 12, signInUnanswered: 0, signInNote: null, signInWindowMinutes: 10,
  radiusPasswordStatus: "CURRENT", radiusPasswordSetAt: "2026-10-15T01:00:00Z", radiusPasswordSetBy: "REPROVISION",
};

describe("customer network health helpers", () => {
  it("raises the alarm only when customers actually hold wrong addresses", () => {
    const sick = { ...base, status: "ATTENTION" as const, unauthorisedDhcpServers: 23, devicesOnWrongAddress: 3 };
    expect(routersWithCustomersOnWrongAddress([base, sick])).toEqual([sick]);
    expect(routersWithDhcpServersOnly([sick])).toEqual([]);
    expect(lanProblemSentence(sick)).toBe(
      "3 customer devices have an address the router did not give out and cannot reach the payment page or the internet; " +
      "23 devices on the network are handing out addresses."
    );
  });

  it("treats DHCP servers with no customer affected as a risk, not an alarm", () => {
    // ADRINOLD-WESTLANDS on 14 Oct 2026: 23 Tendas handing out addresses, customers connecting normally
    const risky = { ...base, status: "ATTENTION" as const, unauthorisedDhcpServers: 23, devicesOnWrongAddress: 0 };
    expect(routersWithCustomersOnWrongAddress([risky])).toEqual([]);
    expect(routersWithDhcpServersOnly([base, risky])).toEqual([risky]);
    expect(lanProblemSentence(risky)).toBe(
      "23 devices are set up to hand out addresses, which only the router should do. No customer holds one of their addresses right now."
    );
  });

  it("reports wrong addresses even when no DHCP server was caught", () => {
    const odd = { ...base, status: "ATTENTION" as const, devicesOnWrongAddress: 1 };
    expect(routersWithCustomersOnWrongAddress([base, odd])).toEqual([odd]);
    expect(lanProblemSentence(odd)).toBe(
      "1 customer device has an address the router did not give out and cannot reach the payment page or the internet."
    );
  });

  it("never alarms on a router that could not be read", () => {
    const blind = { ...base, status: "UNKNOWN" as const, unauthorisedDhcpServers: 5, devicesOnWrongAddress: 9 };
    expect(routersWithCustomersOnWrongAddress([blind])).toEqual([]);
    expect(routersWithDhcpServersOnly([blind])).toEqual([]);
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

  it("treats a router with an old RADIUS password as unable to sign anyone in, before anyone tries", () => {
    // BEESMART C - WESTLANDS on 14 Oct 2026: linked before the rotation, refused on every sign-in
    const stale = { ...base, status: "ATTENTION" as const, signInStatus: "NO_ATTEMPTS" as const, radiusPasswordStatus: "OUT_OF_DATE" as const };
    expect(routersWithOldPassword([base, stale])).toEqual([stale]);
    expect(routersThatCannotSignIn([base, stale])).toEqual([stale]);
    expect(signInProblemSentence(stale)).toBe(
      "the router holds an old RADIUS password, so the sign-in server refuses every customer from it."
    );
    expect(passwordLabel(stale)).toBe("Out of date");
    expect(passwordLabel({ radiusPasswordStatus: "UNKNOWN" })).toBe("Not recorded");
  });

  it("describes a router clock in plain words (ADRINOLD-WESTLANDS, 23 Oct: 4 h 56 min slow)", () => {
    expect(clockOffsetLabel(-17816)).toBe("4 h 56 min slow");
    expect(clockOffsetLabel(420)).toBe("7 min fast");
    expect(clockOffsetLabel(3)).toBe("on time");
    expect(clockLabel({ clockStatus: "WRONG", clockOffsetSeconds: -17816 })).toBe("Wrong (4 h 56 min slow)");
    expect(clockLabel({ clockStatus: "NO_TIME_SERVER", clockOffsetSeconds: 1 })).toBe("Right, no time server");
    expect(clockLabel({})).toBe("Not read");
    expect(clockCorrectedSentence(
      { clockCorrectedAt: "2026-10-23T12:13:39Z", clockCorrectedBySeconds: -17816 }, Date.parse("2026-10-23T12:23:39Z")
    )).toBe("set 10 min ago; it was 4 h 56 min slow");
    expect(clockCorrectedSentence({ clockCorrectedAt: null })).toBeNull();
  });

  it("names a wrong clock as the problem, since it hides every purchase on the router", () => {
    const slow = { ...base, status: "ATTENTION" as const, clockStatus: "WRONG" as const, clockOffsetSeconds: -17816 };
    expect(lanProblemSentence(slow)).toContain("4 h 56 min slow");
    expect(lanProblemSentence(slow)).toContain("Paid, not connected");
  });

  it("explains every term in plain words and gives every colour a meaning", () => {
    for (const entry of Object.values(NETWORK_HEALTH_HELP)) {
      expect(entry.title.length).toBeGreaterThan(3);
      expect(entry.means.length).toBeGreaterThan(20);
    }
    expect(NETWORK_HEALTH_HELP.rogueDhcp.todo).toContain("access point (AP) mode");
    expect(COLOUR_LEGEND.map((c) => c.colour)).toEqual(["green", "red", "amber", "grey"]);
  });
});
