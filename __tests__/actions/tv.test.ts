import { describe, it, expect } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import { activeTvPackagesFixture, errorEnvelope } from "@/contracts/catalog";
import { getTvPackagesAction } from "@/actions/tv";
import { mapToTvPackage } from "@/lib/utils/tvPackages";
import type { NetPackage } from "@/lib/types/api";

describe("TV packages", () => {
  it("fetches TV packages with public auth (no Authorization header) and maps them", async () => {
    let capturedAuth: string | null | undefined = "unset";
    server.use(
      http.get(`${API_PREFIX}/hotspot/packages`, ({ request }) => {
        capturedAuth = request.headers.get("authorization");
        const url = new URL(request.url);
        expect(url.searchParams.get("category")).toBe("TV");
        return HttpResponse.json(activeTvPackagesFixture(), { status: 200 });
      })
    );

    const result = await getTvPackagesAction();
    expect(capturedAuth).toBeNull();
    expect(result.packages).toHaveLength(2);

    const first = result.packages[0];
    expect(first.packageName).toBe("TV 24H");
    expect(first.validity).toBe("24 hours");
    expect(first.maxDevices).toBe(1);
    expect(first.dataAllowance).toBe("15M/15M");

    const second = result.packages[1];
    expect(second.validity).toBe("7 days");
    expect(second.dataAllowance).toBe("Unlimited"); // bandwidthType UNLIMITED
    expect(second.maxDevices).toBe(2);
  });

  it("filters out non-TV packages client-side", async () => {
    server.use(
      http.get(`${API_PREFIX}/hotspot/packages`, () =>
        HttpResponse.json(
          {
            status: 200,
            success: true,
            message: "ok",
            data: [
              { idxno: 1, packageName: "Hotspot 10M", price: 100, packageCategory: "HOTSPOT", activeStatus: true },
              { idxno: 2, packageName: "TV 24H", price: 150, packageCategory: "TV", validityType: "HOURS", validityValue: 24, activeStatus: true },
            ],
          },
          { status: 200 }
        )
      )
    );
    const result = await getTvPackagesAction();
    expect(result.packages).toHaveLength(1);
    expect(result.packages[0].packageName).toBe("TV 24H");
  });

  it("returns an empty list on backend failure", async () => {
    server.use(
      http.get(`${API_PREFIX}/hotspot/packages`, () =>
        HttpResponse.json(errorEnvelope(500, "boom"), { status: 500 })
      )
    );
    const result = await getTvPackagesAction();
    expect(result.packages).toEqual([]);
  });
});

describe("mapToTvPackage", () => {
  it("derives validity, dataAllowance and maxDevices from the NetPackage", () => {
    const net: NetPackage = {
      idxno: 9,
      packageName: "TV 7 DAYS",
      price: 800,
      packageCategory: "TV",
      validityType: "DAYS",
      validityValue: 7,
      bandwidthType: "SHARED",
      activeStatus: true,
      speedDownload: 20,
      speedUpload: 10,
      rateLimit: "20M/10M",
      maxDevices: 2,
    };
    const tv = mapToTvPackage(net);
    expect(tv.validity).toBe("7 days");
    expect(tv.dataAllowance).toBe("20M/10M");
    expect(tv.maxDevices).toBe(2);
    expect(tv.speedDownload).toBe(20);
  });
});
