/// <reference types="vitest/globals" />
import "@testing-library/jest-dom/vitest";
import { server } from "./mocks/server";

process.env.BASE_API_URL = "http://localhost:8381/api/v1/";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "1",
      name: "Test User",
      email: "test@example.com",
      role: "admin",
      apiToken: "mock-valid-bearer-token",
      refreshToken: "mock-refresh-token",
      regionId: 1,
      stationId: 2,
      locationId: 3,
    },
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({
    back: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
  useSession: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// MSW network-level mock server backed by contracts/catalog.ts fixtures.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());