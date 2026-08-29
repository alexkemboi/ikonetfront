import { MatchersV3 } from "@pact-foundation/pact";

/**
 * Deep-converts a catalog fixture into Pact V3 matching rules so the contract
 * asserts SHAPE + TYPE (not hardcoded values):
 *  - objects → `MatchersV3.like({ ... })` (per-key, recursively)
 *  - arrays  → `MatchersV3.eachLike(element, { min })` (non-empty minimums)
 *  - scalars → `MatchersV3.like(value)` (type match)
 *
 * This is the single bridge between `contracts/catalog.ts` (D5) and the pact
 * consumer specs — updating a fixture updates both MSW and Pact at once.
 */
export function matchersFor(value: unknown): unknown {
  if (Array.isArray(value)) {
    if (value.length === 0) return MatchersV3.like([]);
    // `min: 1` keeps shape/type fidelity (element template matches every item)
    // without over-constraining the provider on paginated/limited arrays
    // (e.g. history must only return *at least one* snapshot).
    return MatchersV3.eachLike(matchersFor(value[0]), 1);
  }
  if (value !== null && typeof value === "object") {
    const shaped: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      shaped[key] = matchersFor(val);
    }
    return MatchersV3.like(shaped);
  }
  if (typeof value === "string") return MatchersV3.like(value);
  if (typeof value === "number") return MatchersV3.like(value);
  if (typeof value === "boolean") return MatchersV3.like(value);
  return MatchersV3.like(value ?? 0);
}