import { afterEach, describe, expect, it, vi } from "vitest";

describe("buildApiUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it.each(["https://api.example.test/api/v1", "https://api.example.test/api/v1/"])(
    "normalizes a base URL with or without a trailing slash: %s",
    async (baseUrl) => {
      vi.stubEnv("BASE_API_URL", baseUrl);
      vi.resetModules();
      const { buildApiUrl } = await import("@/lib/constants");
      expect(buildApiUrl("/system-setup/01/menus")).toBe(
        "https://api.example.test/api/v1/system-setup/01/menus"
      );
    }
  );
});