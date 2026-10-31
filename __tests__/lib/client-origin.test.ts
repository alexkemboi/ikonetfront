import { describe, it, expect, vi, beforeEach } from "vitest";

let incoming = new Headers();
vi.mock("next/headers", () => ({ headers: async () => incoming }));

import { clientOriginHeaders } from "@/lib/clientOrigin";

beforeEach(() => {
  incoming = new Headers();
});

describe("clientOriginHeaders", () => {
  it("prefers the address our proxy set", async () => {
    incoming = new Headers({ "x-real-ip": "41.90.1.2", "x-forwarded-for": "1.1.1.1, 41.90.1.2", "user-agent": "Chrome" });
    expect(await clientOriginHeaders()).toEqual({ "X-Forwarded-For": "41.90.1.2", "User-Agent": "Chrome" });
  });

  it("takes the last forwarded entry, not one the visitor made up", async () => {
    incoming = new Headers({ "x-forwarded-for": "6.6.6.6, 41.90.1.2" });
    expect(await clientOriginHeaders()).toEqual({ "X-Forwarded-For": "41.90.1.2" });
  });

  it("drops anything that is not an address", async () => {
    incoming = new Headers({ "x-real-ip": "evil; X-Injected=1" });
    expect(await clientOriginHeaders()).toEqual({});
  });
});
