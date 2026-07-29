import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCustomers, addCustomer } from "@/actions/customer";

const BASE_URL = "http://localhost:8381/api/v1/";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCustomers", () => {
  it("fetches customers with correct URL and auth headers", async () => {
    const mockResponse = {
      status: 200,
      success: true,
      message: "Customers fetched successfully",
      data: {
        content: [
          { id: 1, firstname: "John", lname: "Doe" },
          { id: 2, firstname: "Jane", lname: "Smith" },
        ],
        pageable: {
          pageNumber: 0,
          pageSize: 10,
          sort: { unsorted: false, sorted: true, empty: false },
          offset: 0,
          unpaged: false,
          paged: true,
        },
        totalElements: 2,
        totalPages: 1,
        last: true,
        first: true,
        numberOfElements: 2,
        size: 10,
        number: 0,
        sort: { unsorted: false, sorted: true, empty: false },
        empty: false,
      },
      timestamp: new Date().toISOString(),
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await getCustomers(0, 10);

    const expectedUrl = `${BASE_URL}customers?page=0&size=10&regionId=1&stationId=2&locationId=3`;
    expect(fetchSpy).toHaveBeenCalledWith(expectedUrl, {
      headers: expect.objectContaining({
        "Content-Type": "application/json",
        Authorization: "Bearer mock-valid-bearer-token",
      }),
      next: { tags: ["customers"] },
    });
    expect(result.success).toBe(true);
    expect(result.data.content).toHaveLength(2);
  });
});

describe("addCustomer", () => {
  it("returns error envelope on 500 response", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 500,
          message: "Internal server error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    const payload = {
      username: "johndoe",
      firstname: "John",
      lname: "Doe",
      email: "john@example.com",
      phoneNumber: "+254700000000",
      isActive: true,
      canLogin: true,
    };

    const result = await addCustomer(payload);

    expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}customers`, {
      method: "POST",
      headers: expect.objectContaining({
        "Content-Type": "application/json",
        Authorization: "Bearer mock-valid-bearer-token",
      }),
      body: JSON.stringify(payload),
    });
    expect(result.success).toBe(false);
    expect(result.message).toBeDefined();
    expect(result.status).toBe(500);
  });
});