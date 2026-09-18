import { describe, expect, it } from "vitest";
import { brandCssVars, pickForeground } from "@/lib/brandingTheme";
import type { TenantBranding } from "@/lib/types/company";

describe("pickForeground", () => {
  it("returns dark text for light surfaces", () => {
    expect(pickForeground("#f59e0b")).toBe("#0b0d12");
    expect(pickForeground("#ffffff")).toBe("#0b0d12");
  });

  it("returns white text for dark surfaces", () => {
    expect(pickForeground("#103766")).toBe("#fff");
    expect(pickForeground("#18181b")).toBe("#fff");
    expect(pickForeground("#000000")).toBe("#fff");
  });

  it("normalizes 3-digit hex", () => {
    expect(pickForeground("#fff")).toBe("#0b0d12");
    expect(pickForeground("#103766")).toBe("#fff");
  });

  it("falls back for invalid input", () => {
    expect(pickForeground("garbage")).toBe("#0b0d12");
    expect(pickForeground("")).toBe("#0b0d12");
  });
});

describe("brandCssVars", () => {
  const branding: TenantBranding = {
    code: "CMP-BSM-001",
    name: "Beesmart",
    alias: "BSM",
    subdomain: "beesmart",
    primaryColor: "#3b82f6",
    secondaryColor: "#18181b",
    logoUrl: null,
    supportPhone: null,
    supportEmail: null,
  };

  it("returns undefined without branding (default theme)", () => {
    expect(brandCssVars(null)).toBeUndefined();
  });

  it("maps brand colors to design-system vars with computed foregrounds", () => {
    const vars = brandCssVars(branding) as Record<string, string>;
    expect(vars["--primary"]).toBe("#3b82f6");
    // blue #3b82f6 is mid-dark → white foreground on primary
    expect(vars["--primary-foreground"]).toBe("#fff");
    expect(vars["--sidebar"]).toBe("#18181b");
    expect(vars["--sidebar-foreground"]).toBe("#fff");
    expect(vars["--ring"]).toBe("#3b82f6");
    expect(vars["--chart-1"]).toBe("#3b82f6");
    expect(vars["--sidebar-primary"]).toBe("#fff");
  });

  it("falls back to defaults for missing colors", () => {
    const vars = brandCssVars({
      code: "CMP-X",
      name: "X",
      alias: "X",
      subdomain: "x",
    }) as Record<string, string>;
    expect(vars["--primary"]).toBe("#103766");
    expect(vars["--primary-foreground"]).toBe("#fff");
  });
});