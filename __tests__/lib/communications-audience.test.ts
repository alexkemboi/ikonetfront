import { describe, expect, it } from "vitest";
import type { AudienceTree } from "@/actions/communications";
import { EMPTY_SCOPE, describeScope, headcount, options, pick } from "@/lib/communications/audience";
import { noticeAudience } from "@/components/communications/SmsNoticeHistory";

const node = (id: number, parentId: number | null, name: string, pppoe = 0, hotspot = 0, accounts = 0) =>
  ({ id, parentId, name, active: true, pppoe, hotspot, accounts });

const tree: AudienceTree = {
  regions: [node(1, null, "MOMBASA"), node(2, null, "UKUNDA")],
  locations: [node(3, 1, "MWAIMA"), node(4, 2, "DIANI")],
  stations: [node(3, 3, "WESTGATE"), node(4, 4, "DIANI-BEACH"), node(5, 4, "UKUNDA-TOWN")],
  devices: [node(54, 3, "ADRINOLD-WESTLANDS", 2, 10, 0), node(38, 4, "RTR-DIANI"), node(39, 5, "RTR-UKUNDA")],
  unplaced: 0,
};

describe("network filter", () => {
  it("offers only the places under what is picked above", () => {
    const ukunda = pick(EMPTY_SCOPE, "region", 2);
    const o = options(tree, ukunda);
    expect(o.locations.map((l) => l.name)).toEqual(["DIANI"]);
    expect(o.stations.map((s) => s.name)).toEqual(["DIANI-BEACH", "UKUNDA-TOWN"]);
    expect(o.devices.map((d) => d.name)).toEqual(["RTR-DIANI", "RTR-UKUNDA"]);

    const beach = pick(ukunda, "station", 4);
    expect(options(tree, beach).devices.map((d) => d.name)).toEqual(["RTR-DIANI"]);
    expect(options(tree, EMPTY_SCOPE).devices).toHaveLength(3);
  });

  it("clears the levels below when a higher level changes", () => {
    const deep = pick(pick(pick(EMPTY_SCOPE, "region", 1), "station", 3), "device", 54);
    expect(deep.deviceIds).toEqual([54]);
    const moved = pick(deep, "region", 2);
    expect(moved).toMatchObject({ regionIds: [2], locationIds: [], stationIds: [], deviceIds: [] });
    expect(pick(deep, "device", null).deviceIds).toEqual([]);
  });

  it("counts only the chosen kinds of customer", () => {
    const mikrotik = tree.devices[0]!;
    expect(headcount(mikrotik, [])).toBe(12);
    expect(headcount(mikrotik, ["PPPOE"])).toBe(2);
    expect(headcount(mikrotik, ["HOTSPOT", "ACCOUNT"])).toBe(10);
  });

  it("describes the scope in words, deepest place first", () => {
    expect(describeScope(tree, EMPTY_SCOPE)).toBe("Whole company · all customers");
    expect(describeScope(tree, { ...pick(EMPTY_SCOPE, "station", 3), kinds: ["PPPOE"] }))
      .toBe("WESTGATE · PPPoE subscribers");
    expect(describeScope(tree, { ...EMPTY_SCOPE, deviceIds: [54], kinds: ["HOTSPOT"], hotspotWithinDays: 30 }))
      .toBe("ADRINOLD-WESTLANDS · Hotspot buyers (hotspot: last 30 days)");
  });

  it("reads the scope stored with a sent message", () => {
    expect(noticeAudience(tree, null)).toBe("Whole company");
    expect(noticeAudience(tree, '{"regionIds":[],"locationIds":[],"stationIds":[],"deviceIds":[54],"kinds":[],"hotspotWithinDays":null}'))
      .toBe("ADRINOLD-WESTLANDS · all customers");
    expect(noticeAudience(tree, "not json")).toBe("Part of the network");
  });
});
