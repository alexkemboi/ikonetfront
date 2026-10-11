import { describe, it, expect } from "vitest";
import { isOffered, soldOnLabel } from "@/app/(dashboard)/system/packages/_components/PackageRouterGrid";
import type { PackageAvailability } from "@/actions/packages";

const pkg = (over: Partial<PackageAvailability>): PackageAvailability => ({
  idxno: 7,
  packageName: "Daily 20",
  packageCategory: "Daily",
  price: 20,
  active: true,
  approved: true,
  routerScope: "ALL",
  routerIds: [],
  ...over,
});

describe("where a package is sold", () => {
  it("a package on every router is sold on any router, including one added later", () => {
    expect(isOffered(pkg({}), 54)).toBe(true);
    expect(isOffered(pkg({}), 9999)).toBe(true);
    expect(soldOnLabel(pkg({}), 2)).toBe("All routers");
  });

  it("a site-specific package is sold only where it is switched on", () => {
    const westlandsOnly = pkg({ routerScope: "SELECTED", routerIds: [54] });
    expect(isOffered(westlandsOnly, 54)).toBe(true);
    expect(isOffered(westlandsOnly, 61)).toBe(false);
    expect(soldOnLabel(westlandsOnly, 2)).toBe("1 of 2 routers");
  });

  it("a package switched off everywhere says so", () => {
    expect(soldOnLabel(pkg({ routerScope: "SELECTED", routerIds: [] }), 3)).toBe("No router");
  });
});
