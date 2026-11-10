import { describe, it, expect } from "vitest";
import { routerSignInUrl, safeRouterLoginUrl } from "@/lib/hotspot/routerSignIn";

describe("router sign-in link", () => {
  it("signs the device in on the router's own address with the package code", () => {
    const url = routerSignInUrl({ linkLogin: "http://10.50.50.1/login", linkOrig: "http://neverssl.com/" }, "F5C8B8B5");
    expect(url).toBe("http://10.50.50.1/login?username=F5C8B8B5&password=F5C8B8B5&dst=http%3A%2F%2Fneverssl.com%2F");
  });

  it("never sends the code outside the local network", () => {
    expect(safeRouterLoginUrl("https://evil.example.com/login")).toBeNull();
    expect(safeRouterLoginUrl("http://8.8.8.8/login")).toBeNull();
    expect(safeRouterLoginUrl("javascript:alert(1)")).toBeNull();
    expect(routerSignInUrl({ linkLogin: "http://203.0.113.5/login" }, "F5C8B8B5")).toBeNull();
    // private ranges routers use
    expect(safeRouterLoginUrl("http://192.168.88.1/login")?.toString()).toBe("http://192.168.88.1/login");
    expect(safeRouterLoginUrl("http://172.20.0.1/login")?.toString()).toBe("http://172.20.0.1/login");
  });

  it("drops anything the redirect added after the path", () => {
    expect(routerSignInUrl({ linkLogin: "http://10.50.50.1/login?username=x#y" }, "ABC123")).toBe(
      "http://10.50.50.1/login?username=ABC123&password=ABC123");
  });

  it("does nothing without a sign-in address or a code", () => {
    expect(routerSignInUrl({}, "ABC123")).toBeNull();
    expect(routerSignInUrl({ linkLogin: "http://10.50.50.1/login" }, "")).toBeNull();
  });
});
