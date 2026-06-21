# @mongolian-payment/pass

Pass payment SDK for Node.js — create, cancel, and void orders, inquire status, notify customers.

[![npm version](https://img.shields.io/npm/v/@mongolian-payment/pass.svg)](https://www.npmjs.com/package/@mongolian-payment/pass)
[![license](https://img.shields.io/npm/l/@mongolian-payment/pass.svg)](./LICENSE)

> Part of the **[mongolian-payment](https://github.com/mongolian-payment)** SDK suite.
> Also available for Python: **[mongolian-payment-pass](https://pypi.org/project/mongolian-payment-pass/)** ([source](https://github.com/mongolian-payment/pass-py)).

## Requirements

- Node.js >= 18.0.0 (uses native `fetch`)

## Installation

```bash
npm install @mongolian-payment/pass
```

## Quick Start

```typescript
import { PassClient } from "@mongolian-payment/pass";

const client = new PassClient({
  endpoint: "https://api.pass.mn",
  ecommerceToken: "YOUR_ECOMMERCE_TOKEN",
  callback: "https://yourapp.com/payment/callback",
});

// Create an order (amount is multiplied by 100 before sending)
const order = await client.createOrder(1000);
console.log(order.order_id, order.amount, order.shop);

// Inquire about an order
const status = await client.inquiryOrder(order.order_id);
console.log(status.status); // "paid" | "pending" | "cancelled" | "voided"

// Notify a customer, cancel, or void
await client.notifyOrder(order.order_id, "99001122");
await client.cancelOrder(order.order_id);
await client.voidOrder(order.order_id);
```

## Configuration from Environment Variables

```typescript
import { PassClient, loadConfigFromEnv } from "@mongolian-payment/pass";

const client = new PassClient(loadConfigFromEnv());
```

| Variable               | Description                          |
| ---------------------- | ------------------------------------ |
| `PASS_ENDPOINT`        | Pass API base URL                    |
| `PASS_ECOMMERCE_TOKEN` | E-commerce token for authentication  |
| `PASS_CALLBACK`        | Callback URL for order notifications |

> Never hard-code credentials — load them from the environment or a secrets vault.

## API Reference

The `ecommerce_token` is injected into every request automatically — callers never
deal with token management.

| Method | Description |
|--------|-------------|
| `createOrder(amount, callbackParams?)` | Create a payment order (amount is multiplied by 100) → `{ shop, amount, order_id, order_ttl, db_ref_no }` |
| `inquiryOrder(orderId)` | Check the status of an order |
| `notifyOrder(orderId, phone)` | Send a payment notification to a phone number |
| `cancelOrder(orderId)` | Cancel a pending order |
| `voidOrder(orderId)` | Void a completed order |
| `PassClient.parseWebhook(body)` | Parse and validate a webhook callback payload (static) |

```typescript
// createOrder accepts optional query params appended to the callback URL
const order = await client.createOrder(5000, {
  invoice: "INV-001",
  ref: "my-ref",
});

const status = await client.inquiryOrder(order.order_id);
console.log(status.status, status.resp_code);

// In your webhook handler
import { PassClient, WebhookOperationPayment } from "@mongolian-payment/pass";

const webhook = PassClient.parseWebhook(req.body);
if (webhook.operation === WebhookOperationPayment && webhook.is_success) {
  // Payment successful
}
```

Status and operation constants are exported for convenience:

```typescript
import {
  OrderInquiryStatusPaid,      // "paid"
  OrderInquiryStatusPending,   // "pending"
  OrderInquiryStatusCancelled, // "cancelled"
  OrderInquiryStatusVoided,    // "voided"
  WebhookOperationPayment,     // "payment"
  WebhookOperationVoid,        // "void"
} from "@mongolian-payment/pass";
```

## Error Handling

All API errors throw `PassError`, which includes the API error fields plus the HTTP
status code and response body when available:

```typescript
import { PassError } from "@mongolian-payment/pass";

try {
  await client.createOrder(1000);
} catch (err) {
  if (err instanceof PassError) {
    console.error(err.message); // Human-readable message
    console.error(err.code);    // API error code
    console.error(err.level);   // Error level
    console.error(err.body);    // Error body/description
  }
}
```

## License

MIT
