import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppThemeProvider, useAppTheme } from "@/providers/AppThemeProvider";

let prefersDark = false;
const mediaListeners = new Set<(event: MediaQueryListEvent) => void>();

function setSystemTheme(theme: "light" | "dark") {
  prefersDark = theme === "dark";
  mediaListeners.forEach((listener) => listener(new Event("change") as MediaQueryListEvent));
}

function ThemeToggle() {
  const { theme, toggleTheme } = useAppTheme();
  return <button onClick={toggleTheme}>{theme}</button>;
}

describe("AppThemeProvider", () => {
  beforeEach(() => {
    prefersDark = false;
    mediaListeners.clear();
    vi.stubGlobal("matchMedia", () => ({
      matches: prefersDark,
      media: "(prefers-color-scheme: dark)",
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => mediaListeners.add(listener),
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => mediaListeners.delete(listener),
    }) as MediaQueryList);
    window.localStorage.removeItem("beesmart-theme");
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mediaListeners.clear();
    window.localStorage.removeItem("beesmart-theme");
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "";
  });

  it("persists the selected theme and restores it on the next visit", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <AppThemeProvider>
        <ThemeToggle />
      </AppThemeProvider>
    );

    await user.click(await screen.findByRole("button", { name: "light" }));
    expect(document.documentElement).toHaveClass("dark");
    expect(window.localStorage.getItem("beesmart-theme")).toBe("dark");
    unmount();

    render(
      <AppThemeProvider>
        <ThemeToggle />
      </AppThemeProvider>
    );

    expect(await screen.findByRole("button", { name: "dark" })).toBeInTheDocument();
    expect(document.documentElement).toHaveClass("dark");
  });

  it("follows the browser theme until the user selects a preference", async () => {
    const user = userEvent.setup();
    render(
      <AppThemeProvider>
        <ThemeToggle />
      </AppThemeProvider>
    );

    expect(await screen.findByRole("button", { name: "light" })).toBeInTheDocument();
    act(() => setSystemTheme("dark"));
    expect(await screen.findByRole("button", { name: "dark" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "dark" }));
    expect(screen.getByRole("button", { name: "light" })).toBeInTheDocument();
    act(() => setSystemTheme("dark"));
    expect(screen.getByRole("button", { name: "light" })).toBeInTheDocument();
  });
});
