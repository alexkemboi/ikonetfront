import { PactV3 } from "@pact-foundation/pact";
import { describe, expect, it } from "vitest";
import { allInteractions, type Interaction } from "@/contracts/catalog";
import { matchersFor } from "./matchers";

/**
 * Wave-1 consumer contract — `IBS_Frontend_NextJS` ↔ `IBS_Backend_SpringBoot`.
 *
 * Every interaction below maps to a REAL frontend call site (verified against
 * `actions/`) and is generated 1:1 from `contracts/catalog.ts` (D5) via
 * `matchersFor`. The contract file `pacts/IBS_Frontend_NextJS-IBS_Backend_SpringBoot.json`
 * is committed and consumed by the backend's `@PactFolder` provider test.
 *
 * NOTE: all interactions share a SINGLE PactV3 instance because the Pact FFI
 * writes the pact file on finalize with overwrite semantics — parallel
 * per-domain writers would clobber each other under Vitest's worker pool.
 * Domain sections below mirror the Wave-1 interaction matrix.
 */
const consumer = "IBS_Frontend_NextJS";
const provider = "IBS_Backend_SpringBoot";

const bearer = "Bearer test-access-token";

function buildInteraction(i: Interaction): Parameters<PactV3["addInteraction"]>[0] {
  return {
    states: [{ description: `seed for ${i.name}` }],
    uponReceiving: i.name,
    withRequest: {
      method: i.method,
      path: i.path,
      query: i.query,
      headers: {
        ...(i.auth === "bearer" ? { Authorization: bearer } : {}),
        ...(i.method !== "GET" ? { "Content-Type": "application/json" } : {}),
      },
      body: i.requestBody,
    },
    willRespondWith: {
      status: i.status,
      headers: { "Content-Type": "application/json" },
      body: matchersFor(i.responseBody),
    },
  };
}

function buildRequest(i: Interaction, baseUrl: string): {
  url: URL;
  init: RequestInit;
} {
  const url = new URL(i.path, baseUrl);
  for (const [key, val] of Object.entries(i.query ?? {})) {
    url.searchParams.set(key, val);
  }
  const headers: Record<string, string> = {};
  if (i.auth === "bearer") headers.Authorization = bearer;
  if (i.method !== "GET") headers["Content-Type"] = "application/json";

  return {
    url,
    init: {
      method: i.method,
      headers,
      body: i.requestBody !== undefined ? JSON.stringify(i.requestBody) : undefined,
    },
  };
}

describe(`Pact Wave 1: ${consumer} ↔ ${provider}`, () => {
  it("generates the committed contract from the fixture catalog", async () => {
    const pact = new PactV3({ consumer, provider });
    for (const interaction of allInteractions) {
      pact.addInteraction(buildInteraction(interaction));
    }

    await pact.executeTest(async (mockServer) => {
      for (const i of allInteractions) {
        const { url, init } = buildRequest(i, mockServer.url);

        const res = await fetch(url.toString(), init);
        expect(res.status).toBe(i.status);

        const body = (await res.json()) as Record<string, unknown>;
        // Envelope contract the frontend parse relies on everywhere:
        expect(typeof body.status).toBe("number");
        expect(typeof body.success).toBe("boolean");
        expect(typeof body.message).toBe("string");
        if (body.success === true) {
          expect("data" in body).toBe(true);
        }
      }
    });
  });
});