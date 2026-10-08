import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppThemeProvider, useAppTheme } from "@/providers/AppThemeProvider";

let prefersDark = false;
const mediaListeners = new Set<EventListenerOrEventListenerObject>();

let mockMediaQueryList: MediaQueryList;

function setSystemTheme(theme: "light" | "dark") {
  prefersDark = theme === "dark";
  const event = new Event("change");
  mediaListeners.forEach((listener) => {
    if (typeof listener === "function") listener.call(mockMediaQueryList, event);
    else listener.handleEvent(event);
  });
}

function ThemeToggle() {
  const { theme, toggleTheme } = useAppTheme();
  return <button onClick={toggleTheme}>{theme}</button>;
}

describe("AppThemeProvider", () => {
  beforeEach(() => {
    prefersDark = false;
    mediaListeners.clear();
    vi.stubGlobal("matchMedia", (query: string): MediaQueryList => {
      mockMediaQueryList = {
        matches: prefersDark,
        media: query,
        onchange: null,
        addEventListener: (
          _type: string,
          listener: EventListenerOrEventListenerObject | null
        ) => {
          if (listener) mediaListeners.add(listener);
        },
        removeEventListener: (
          _type: string,
          listener: EventListenerOrEventListenerObject | null
        ) => {
          if (listener) mediaListeners.delete(listener);
        },
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => true,
      };
      return mockMediaQueryList;
    });
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
