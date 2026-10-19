import { describe, expect, it } from "vitest";
import { readableMessage } from "@/lib/apiClient";

describe("readableMessage", () => {
  it("rewords bare HTTP status names and keeps the name as the code", () => {
    const r = readableMessage("NOT_FOUND");
    expect(r.message).toMatch(/^This is not available on the server yet/);
    expect(r.code).toBe("NOT_FOUND");
    expect(readableMessage("FORBIDDEN").message).toBe("You do not have permission to do this.");
  });

  it("leaves app codes that screens compare untouched", () => {
    expect(readableMessage("POSSIBLE_DUPLICATE_BATCH")).toEqual({ message: "POSSIBLE_DUPLICATE_BATCH" });
    expect(readableMessage("TV_PORTAL_TOKEN_EXPIRED")).toEqual({ message: "TV_PORTAL_TOKEN_EXPIRED" });
  });

  it("leaves ordinary sentences untouched", () => {
    expect(readableMessage("Router not found").message).toBe("Router not found");
    expect(readableMessage(undefined).message).toBeUndefined();
  });
});
