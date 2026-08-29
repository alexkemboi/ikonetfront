import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import {
  customersPageFixture,
  customerByIdFixture,
  errorEnvelope,
} from "@/contracts/catalog";
import { getCustomers, getCustomerById, addCustomer } from "@/actions/customer";
import { revalidatePath, revalidateTag } from "next/cache";

const TOKEN = "mock-valid-bearer-token";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCustomers", () => {
  it("fetches the customers Page envelope with Bearer auth", async () => {
    const result = await getCustomers(0, 10);

    expect(result.success).toBe(true);
    expect(result.data?.content).toHaveLength(2);
    expect(result.data?.totalElements).toBe(2);
  });

  it("sends the Authorization header on this protected route", async () => {
    server.use(
      http.get(`${API_PREFIX}/customers`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        return HttpResponse.json(customersPageFixture(), { status: 200 });
      })
    );

    await getCustomers(0, 10);
  });

  it("passes page/size/scope query params to the backend", async () => {
    server.use(
      http.get(`${API_PREFIX}/customers`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("page")).toBe("0");
        expect(url.searchParams.get("size")).toBe("10");
        expect(url.searchParams.get("regionId")).toBe("1");
        expect(url.searchParams.get("stationId")).toBe("2");
        expect(url.searchParams.get("locationId")).toBe("3");
        return HttpResponse.json(customersPageFixture(), { status: 200 });
      })
    );

    await getCustomers(0, 10);
  });

  it("re-fetches fresh data after revalidateTag (page-refresh flow)", async () => {
    let call = 0;
    server.use(
      http.get(`${API_PREFIX}/customers`, () => {
        call += 1;
        return HttpResponse.json(
          call === 1 ? customersPageFixture(2, 2) : customersPageFixture(2, 5),
          { status: 200 }
        );
      })
    );

    const first = await getCustomers(0, 10);
    expect(first.data?.totalElements).toBe(2);

    revalidateTag("customers", "page"); // simulated invalidation
    const second = await getCustomers(0, 10);
    expect(second.data?.totalElements).toBe(5);
  });
});

describe("getCustomerById", () => {
  it("fetches a single customer by idxno", async () => {
    const result = await getCustomerById(1);
    expect(result.success).toBe(true);
    expect(result.data?.userIdxno).toBe(customerByIdFixture().data?.userIdxno);
  });
});

describe("addCustomer", () => {
  it("POSTs Bearer payload and calls revalidatePath (button-click refresh)", async () => {
    server.use(
      http.post(`${API_PREFIX}/customers`, async ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        const body = (await request.json()) as Record<string, unknown>;
        expect(body.username).toBe("johndoe");
        expect(body.firstname).toBe("John");
        return HttpResponse.json(customersPageFixture(), { status: 200 });
      })
    );

    const result = await addCustomer({
      username: "johndoe",
      firstname: "John",
      lname: "Doe",
      email: "john@example.com",
      phoneNumber: "+254700000000",
      isActive: true,
      canLogin: true,
    });

    expect(result.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/customers/all");
  });

  it("returns an error envelope on a 500 response", async () => {
    server.use(
      http.post(`${API_PREFIX}/customers`, () =>
        HttpResponse.json(errorEnvelope(500, "Internal server error"), { status: 500 })
      )
    );

    const result = await addCustomer({
      username: "johndoe",
      firstname: "John",
      lname: "Doe",
      email: "john@example.com",
      phoneNumber: "+254700000000",
      isActive: true,
      canLogin: true,
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe(500);
    expect(result.message).toBe("Internal server error");
  });
});