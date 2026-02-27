import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PassClient } from "../src/client.js";
import { PassError } from "../src/errors.js";
import { loadConfigFromEnv } from "../src/config.js";
import type {
  CreateOrderResponse,
  OrderInquiryResponse,
  OrderNotifyResponse,
  OrderCancelResponse,
  OrderVoidResponse,
} from "../src/types.js";

// ── Helpers ──

const CONFIG = {
  endpoint: "https://api.pass.test",
  ecommerceToken: "test-token-123",
  callback: "https://merchant.test/callback",
};

function makeCreateOrderResponse(
  overrides?: Partial<CreateOrderResponse>
): CreateOrderResponse {
  return {
    status_code: "0",
    ret: {
      shop: "TestShop",
      amount: "100000",
      order_id: "ORD001",
      order_ttl: 3600,
      db_ref_no: "REF001",
    },
    ...overrides,
  };
}

function makeInquiryResponse(
  overrides?: Partial<OrderInquiryResponse>
): OrderInquiryResponse {
  return {
    status_code: "0",
    ret: {
      resp_code: "00",
      resp_msg: "Success",
      status: "paid",
      amount: "100000",
      db_ref_no: "REF001",
      status_text: "Paid",
    },
    ...overrides,
  };
}

function makeNotifyResponse(
  overrides?: Partial<OrderNotifyResponse>
): OrderNotifyResponse {
  return {
    status_code: "0",
    ret: {
      resp_code: "00",
      resp_msg: "Success",
      success: 1,
      data: [{ success: true, message_id: "MSG001" }],
    },
    ...overrides,
  };
}

function makeCancelResponse(
  overrides?: Partial<OrderCancelResponse>
): OrderCancelResponse {
  return {
    status_code: "0",
    ret: {
      resp_code: "00",
      resp_msg: "Cancelled",
      status: "cancelled",
      amount: "100000",
      loyalty_data: null,
      db_ref_no: "REF001",
    },
    ...overrides,
  };
}

function makeVoidResponse(
  overrides?: Partial<OrderVoidResponse>
): OrderVoidResponse {
  return {
    status_code: "0",
    ret: {
      resp_code: "00",
      resp_msg: "Voided",
      status: "voided",
      amount: "100000",
      loyalty_data: null,
      db_ref_no: "REF001",
      service_name: "pass",
      date_time: "2026-01-15T10:30:00",
      trace_no: "TRACE001",
      rrn: "RRN001",
      terminal_id: "TERM001",
      merchant_id: "MERCH001",
    },
    ...overrides,
  };
}

// ── Tests ──

describe("PassClient", () => {
  let client: PassClient;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new PassClient(CONFIG);
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Constructor ──

  describe("constructor", () => {
    it("should throw if endpoint is missing", () => {
      expect(
        () => new PassClient({ ...CONFIG, endpoint: "" })
      ).toThrow("endpoint is required");
    });

    it("should throw if ecommerceToken is missing", () => {
      expect(
        () => new PassClient({ ...CONFIG, ecommerceToken: "" })
      ).toThrow("ecommerceToken is required");
    });

    it("should throw if callback is missing", () => {
      expect(
        () => new PassClient({ ...CONFIG, callback: "" })
      ).toThrow("callback is required");
    });

    it("should strip trailing slash from endpoint", () => {
      const c = new PassClient({
        ...CONFIG,
        endpoint: "https://api.pass.test///",
      });
      expect(c).toBeInstanceOf(PassClient);
    });
  });

  // ── createOrder ──

  describe("createOrder", () => {
    it("should send correct request and return order data", async () => {
      const raw = makeCreateOrderResponse();
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => raw,
      });

      const result = await client.createOrder(1000);

      expect(fetchSpy).toHaveBeenCalledOnce();
      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toBe("https://api.pass.test/create_order");
      expect(opts.method).toBe("POST");
      expect(opts.headers["Content-Type"]).toBe("application/json");

      const body = JSON.parse(opts.body);
      expect(body.ecommerce_token).toBe("test-token-123");
      expect(body.amount).toBe(100000); // 1000 * 100
      expect(body.callback_url).toBe("https://merchant.test/callback");

      expect(result).toEqual({
        shop: "TestShop",
        amount: "100000",
        order_id: "ORD001",
        order_ttl: 3600,
        db_ref_no: "REF001",
      });
    });

    it("should multiply amount by 100", async () => {
      const raw = makeCreateOrderResponse();
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => raw,
      });

      await client.createOrder(50.5);

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.amount).toBe(5050); // 50.5 * 100
    });

    it("should append callback params to URL", async () => {
      const raw = makeCreateOrderResponse();
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => raw,
      });

      await client.createOrder(1000, { invoice: "INV001", ref: "abc" });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.callback_url).toContain("https://merchant.test/callback?");
      expect(body.callback_url).toContain("invoice=INV001");
      expect(body.callback_url).toContain("ref=abc");
    });

    it("should use & separator when callback already has query params", async () => {
      const clientWithParams = new PassClient({
        ...CONFIG,
        callback: "https://merchant.test/callback?existing=1",
      });

      const raw = makeCreateOrderResponse();
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => raw,
      });

      await clientWithParams.createOrder(1000, { extra: "val" });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.callback_url).toBe(
        "https://merchant.test/callback?existing=1&extra=val"
      );
    });
  });

  // ── inquiryOrder ──

  describe("inquiryOrder", () => {
    it("should send correct request and return inquiry data", async () => {
      const raw = makeInquiryResponse();
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => raw,
      });

      const result = await client.inquiryOrder("ORD001");

      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toBe("https://api.pass.test/order_inquiry");

      const body = JSON.parse(opts.body);
      expect(body.ecommerce_token).toBe("test-token-123");
      expect(body.order_id).toBe("ORD001");

      expect(result).toEqual({
        resp_code: "00",
        resp_msg: "Success",
        status: "paid",
        amount: "100000",
        db_ref_no: "REF001",
        status_text: "Paid",
      });
    });
  });

  // ── notifyOrder ──

  describe("notifyOrder", () => {
    it("should send correct request and return notify data", async () => {
      const raw = makeNotifyResponse();
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => raw,
      });

      const result = await client.notifyOrder("ORD001", "99001122");

      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toBe("https://api.pass.test/order_notify");

      const body = JSON.parse(opts.body);
      expect(body.ecommerce_token).toBe("test-token-123");
      expect(body.order_id).toBe("ORD001");
      expect(body.phone).toBe("99001122");

      expect(result).toEqual({
        resp_code: "00",
        resp_msg: "Success",
        success: 1,
        data: [{ success: true, message_id: "MSG001" }],
      });
    });
  });

  // ── cancelOrder ──

  describe("cancelOrder", () => {
    it("should send correct request and return cancel data", async () => {
      const raw = makeCancelResponse();
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => raw,
      });

      const result = await client.cancelOrder("ORD001");

      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toBe("https://api.pass.test/cancel_order");

      const body = JSON.parse(opts.body);
      expect(body.ecommerce_token).toBe("test-token-123");
      expect(body.order_id).toBe("ORD001");

      expect(result).toEqual({
        resp_code: "00",
        resp_msg: "Cancelled",
        status: "cancelled",
        amount: "100000",
        loyalty_data: null,
        db_ref_no: "REF001",
      });
    });
  });

  // ── voidOrder ──

  describe("voidOrder", () => {
    it("should send correct request and return void data", async () => {
      const raw = makeVoidResponse();
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => raw,
      });

      const result = await client.voidOrder("ORD001");

      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toBe("https://api.pass.test/void");

      const body = JSON.parse(opts.body);
      expect(body.ecommerce_token).toBe("test-token-123");
      expect(body.order_id).toBe("ORD001");

      expect(result).toEqual({
        resp_code: "00",
        resp_msg: "Voided",
        status: "voided",
        amount: "100000",
        loyalty_data: null,
        db_ref_no: "REF001",
        service_name: "pass",
        date_time: "2026-01-15T10:30:00",
        trace_no: "TRACE001",
        rrn: "RRN001",
        terminal_id: "TERM001",
        merchant_id: "MERCH001",
      });
    });
  });

  // ── parseWebhook ──

  describe("parseWebhook", () => {
    it("should parse a valid webhook payload", () => {
      const payload = {
        order_id: "ORD001",
        payment_request_id: "PR001",
        pos_id: "POS001",
        operation: "payment",
        is_success: true,
        amount: "100000",
        created_time: "2026-01-15T10:30:00",
        db_ref_no: "REF001",
      };

      const result = PassClient.parseWebhook(payload);

      expect(result.order_id).toBe("ORD001");
      expect(result.operation).toBe("payment");
      expect(result.is_success).toBe(true);
      expect(result.amount).toBe("100000");
    });

    it("should parse a webhook with customer_data and extra_data", () => {
      const payload = {
        order_id: "ORD002",
        payment_request_id: "PR002",
        pos_id: "POS001",
        operation: "void",
        is_success: true,
        amount: "50000",
        created_time: "2026-01-15T11:00:00",
        db_ref_no: "REF002",
        customer_data: {
          user_id: "U001",
          unique_id: "UNQ001",
        },
        extra_data: {
          key1: "val1",
        },
      };

      const result = PassClient.parseWebhook(payload);

      expect(result.customer_data).toEqual({
        user_id: "U001",
        unique_id: "UNQ001",
      });
      expect(result.extra_data).toEqual({ key1: "val1" });
    });

    it("should throw PassError for null payload", () => {
      expect(() => PassClient.parseWebhook(null)).toThrow(PassError);
      expect(() => PassClient.parseWebhook(null)).toThrow(
        "Invalid webhook payload: expected an object"
      );
    });

    it("should throw PassError for non-object payload", () => {
      expect(() => PassClient.parseWebhook("string")).toThrow(PassError);
    });

    it("should throw PassError for missing order_id", () => {
      expect(() => PassClient.parseWebhook({ foo: "bar" })).toThrow(
        "missing or invalid order_id"
      );
    });

    it("should throw PassError for empty order_id", () => {
      expect(() =>
        PassClient.parseWebhook({ order_id: "" })
      ).toThrow("missing or invalid order_id");
    });
  });

  // ── Error handling ──

  describe("error handling", () => {
    it("should throw PassError when API returns error in msg", async () => {
      const raw: CreateOrderResponse = {
        status_code: "1",
        msg: {
          code: "AUTH_ERROR",
          level: "error",
          body: "Invalid ecommerce token",
        },
      };
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => raw,
      });

      await expect(client.createOrder(1000)).rejects.toThrow(PassError);
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => raw,
      });
      await expect(client.createOrder(1000)).rejects.toThrow(
        "Pass API error (AUTH_ERROR): Invalid ecommerce token"
      );
    });

    it("should include baseError details in PassError", async () => {
      const raw: CreateOrderResponse = {
        status_code: "1",
        msg: {
          code: "VALIDATION",
          level: "warn",
          body: "Amount too low",
        },
      };
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => raw,
      });

      try {
        await client.createOrder(0);
      } catch (err) {
        expect(err).toBeInstanceOf(PassError);
        const passErr = err as PassError;
        expect(passErr.code).toBe("VALIDATION");
        expect(passErr.level).toBe("warn");
        expect(passErr.body).toBe("Amount too low");
      }
    });

    it("should throw PassError on HTTP error", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal Server Error" }),
      });

      await expect(client.createOrder(1000)).rejects.toThrow(
        "Pass API error: HTTP 500"
      );
    });

    it("should throw PassError on network failure", async () => {
      fetchSpy.mockRejectedValueOnce(new Error("Connection refused"));

      await expect(client.createOrder(1000)).rejects.toThrow(
        "Network error calling /create_order: Connection refused"
      );
    });

    it("should throw PassError on invalid JSON", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError("Unexpected token");
        },
      });

      await expect(client.createOrder(1000)).rejects.toThrow(
        "Invalid JSON response from /create_order"
      );
    });
  });
});

// ── loadConfigFromEnv ──

describe("loadConfigFromEnv", () => {
  beforeEach(() => {
    vi.stubEnv("PASS_ENDPOINT", "");
    vi.stubEnv("PASS_ECOMMERCE_TOKEN", "");
    vi.stubEnv("PASS_CALLBACK", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should load config from environment variables", () => {
    vi.stubEnv("PASS_ENDPOINT", "https://api.pass.test");
    vi.stubEnv("PASS_ECOMMERCE_TOKEN", "tok123");
    vi.stubEnv("PASS_CALLBACK", "https://merchant.test/cb");

    const config = loadConfigFromEnv();
    expect(config).toEqual({
      endpoint: "https://api.pass.test",
      ecommerceToken: "tok123",
      callback: "https://merchant.test/cb",
    });
  });

  it("should throw if PASS_ENDPOINT is missing", () => {
    vi.stubEnv("PASS_ECOMMERCE_TOKEN", "tok123");
    vi.stubEnv("PASS_CALLBACK", "https://merchant.test/cb");

    expect(() => loadConfigFromEnv()).toThrow("PASS_ENDPOINT");
  });

  it("should throw if PASS_ECOMMERCE_TOKEN is missing", () => {
    vi.stubEnv("PASS_ENDPOINT", "https://api.pass.test");
    vi.stubEnv("PASS_CALLBACK", "https://merchant.test/cb");

    expect(() => loadConfigFromEnv()).toThrow("PASS_ECOMMERCE_TOKEN");
  });

  it("should throw if PASS_CALLBACK is missing", () => {
    vi.stubEnv("PASS_ENDPOINT", "https://api.pass.test");
    vi.stubEnv("PASS_ECOMMERCE_TOKEN", "tok123");

    expect(() => loadConfigFromEnv()).toThrow("PASS_CALLBACK");
  });
});
