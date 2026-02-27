import type {
  PassConfig,
  CreateOrderInput,
  CreateOrderResponse,
  RetCreateOrder,
  OrderInquiryInput,
  OrderInquiryResponse,
  RetInquiryOrder,
  OrderNotifyInput,
  OrderNotifyResponse,
  RetNotifyOrder,
  OrderCancelInput,
  OrderCancelResponse,
  RetOrderCancel,
  OrderVoidInput,
  OrderVoidResponse,
  RetOrderVoid,
  WebhookCallbackResponse,
} from "./types.js";
import { PassError } from "./errors.js";

/**
 * Pass payment client.
 *
 * All methods automatically inject the ecommerce_token into every request body,
 * so callers never need to deal with token management.
 */
export class PassClient {
  private readonly endpoint: string;
  private readonly ecommerceToken: string;
  private readonly callback: string;

  constructor(config: PassConfig) {
    if (!config.endpoint) {
      throw new Error("PassClient: endpoint is required");
    }
    if (!config.ecommerceToken) {
      throw new Error("PassClient: ecommerceToken is required");
    }
    if (!config.callback) {
      throw new Error("PassClient: callback is required");
    }

    // Strip trailing slash for consistent URL building
    this.endpoint = config.endpoint.replace(/\/+$/, "");
    this.ecommerceToken = config.ecommerceToken;
    this.callback = config.callback;
  }

  // ── Public API ──

  /**
   * Create a new order.
   *
   * @param amount - Order amount (will be multiplied by 100 before sending)
   * @param callbackParams - Optional query parameters to append to the callback URL
   * @returns The created order details
   */
  async createOrder(
    amount: number,
    callbackParams?: Record<string, string>
  ): Promise<RetCreateOrder> {
    let callbackUrl = this.callback;
    if (callbackParams && Object.keys(callbackParams).length > 0) {
      const params = new URLSearchParams(callbackParams);
      const separator = callbackUrl.includes("?") ? "&" : "?";
      callbackUrl = `${callbackUrl}${separator}${params.toString()}`;
    }

    const body: CreateOrderInput = {
      ecommerce_token: this.ecommerceToken,
      amount: amount * 100,
      callback_url: callbackUrl,
    };

    const data = await this.post<CreateOrderResponse>("/create_order", body);
    this.checkError(data);
    return data.ret!;
  }

  /**
   * Inquire about an order's status.
   *
   * @param orderId - The order ID to inquire about
   * @returns The order inquiry result
   */
  async inquiryOrder(orderId: string): Promise<RetInquiryOrder> {
    const body: OrderInquiryInput = {
      ecommerce_token: this.ecommerceToken,
      order_id: orderId,
    };

    const data = await this.post<OrderInquiryResponse>(
      "/order_inquiry",
      body
    );
    this.checkError(data);
    return data.ret!;
  }

  /**
   * Send a notification for an order to a phone number.
   *
   * @param orderId - The order ID
   * @param phone - The phone number to notify
   * @returns The notification result
   */
  async notifyOrder(orderId: string, phone: string): Promise<RetNotifyOrder> {
    const body: OrderNotifyInput = {
      ecommerce_token: this.ecommerceToken,
      order_id: orderId,
      phone,
    };

    const data = await this.post<OrderNotifyResponse>("/order_notify", body);
    this.checkError(data);
    return data.ret!;
  }

  /**
   * Cancel an order.
   *
   * @param orderId - The order ID to cancel
   * @returns The cancellation result
   */
  async cancelOrder(orderId: string): Promise<RetOrderCancel> {
    const body: OrderCancelInput = {
      ecommerce_token: this.ecommerceToken,
      order_id: orderId,
    };

    const data = await this.post<OrderCancelResponse>("/cancel_order", body);
    this.checkError(data);
    return data.ret!;
  }

  /**
   * Void an order.
   *
   * @param orderId - The order ID to void
   * @returns The void result
   */
  async voidOrder(orderId: string): Promise<RetOrderVoid> {
    const body: OrderVoidInput = {
      ecommerce_token: this.ecommerceToken,
      order_id: orderId,
    };

    const data = await this.post<OrderVoidResponse>("/void", body);
    this.checkError(data);
    return data.ret!;
  }

  /**
   * Parse and validate a webhook callback payload.
   *
   * @param body - The raw webhook request body
   * @returns The parsed webhook response
   * @throws {PassError} if the payload is invalid
   */
  static parseWebhook(body: unknown): WebhookCallbackResponse {
    if (!body || typeof body !== "object") {
      throw new PassError("Invalid webhook payload: expected an object");
    }

    const payload = body as Record<string, unknown>;

    if (typeof payload.order_id !== "string" || !payload.order_id) {
      throw new PassError(
        "Invalid webhook payload: missing or invalid order_id"
      );
    }

    return payload as unknown as WebhookCallbackResponse;
  }

  // ── Private helpers ──

  /**
   * Check for API-level errors in the response and throw PassError if found.
   */
  private checkError(
    data: { msg?: { code: string; level: string; body: string } }
  ): void {
    if (data.msg && data.msg.code) {
      throw new PassError(
        `Pass API error (${data.msg.code}): ${data.msg.body}`,
        { baseError: data.msg, response: data }
      );
    }
  }

  /**
   * Send a POST request to the Pass API.
   */
  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.endpoint}${path}`;

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new PassError(
        `Network error calling ${path}: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      throw new PassError(`Invalid JSON response from ${path}`, {
        statusCode: res.status,
      });
    }

    if (!res.ok) {
      throw new PassError(`Pass API error: HTTP ${res.status}`, {
        statusCode: res.status,
        response: json,
      });
    }

    return json as T;
  }
}
