# @mongolian-payment/pass

Pass payment SDK for Node.js -- create/cancel/void orders, inquire status, notify customers.

## Installation

```bash
npm install @mongolian-payment/pass
```

Requires Node.js >= 18.0.0 (uses native `fetch`).

## Quick Start

```typescript
import { PassClient } from "@mongolian-payment/pass";

const client = new PassClient({
  endpoint: "https://api.pass.mn",
  ecommerceToken: "your-ecommerce-token",
  callback: "https://yoursite.com/payment/callback",
});

// Create an order (amount is automatically multiplied by 100)
const order = await client.createOrder(1000);
console.log(order.order_id);

// Inquire about an order
const status = await client.inquiryOrder(order.order_id);
console.log(status.status); // "paid" | "pending" | "cancelled" | "voided"

// Notify customer
await client.notifyOrder(order.order_id, "99001122");

// Cancel an order
await client.cancelOrder(order.order_id);

// Void an order
await client.voidOrder(order.order_id);
```

## Configuration

### Direct Configuration

```typescript
const client = new PassClient({
  endpoint: "https://api.pass.mn",
  ecommerceToken: "your-token",
  callback: "https://yoursite.com/callback",
});
```

### From Environment Variables

```typescript
import { loadConfigFromEnv, PassClient } from "@mongolian-payment/pass";

// Reads PASS_ENDPOINT, PASS_ECOMMERCE_TOKEN, PASS_CALLBACK
const config = loadConfigFromEnv();
const client = new PassClient(config);
```

## API

### `createOrder(amount, callbackParams?)`

Create a new payment order. The amount is multiplied by 100 before sending to the API.

```typescript
// Basic order
const order = await client.createOrder(5000);

// With callback query parameters
const order = await client.createOrder(5000, {
  invoice: "INV-001",
  ref: "my-ref",
});
```

### `inquiryOrder(orderId)`

Check the status of an existing order.

```typescript
const result = await client.inquiryOrder("ORD123");
// result.status: "paid" | "pending" | "cancelled" | "voided"
```

### `notifyOrder(orderId, phone)`

Send a payment notification to a phone number.

```typescript
await client.notifyOrder("ORD123", "99001122");
```

### `cancelOrder(orderId)`

Cancel a pending order.

```typescript
await client.cancelOrder("ORD123");
```

### `voidOrder(orderId)`

Void a completed order.

```typescript
await client.voidOrder("ORD123");
```

### `PassClient.parseWebhook(body)`

Parse and validate a webhook callback payload.

```typescript
import { PassClient, WebhookOperationPayment } from "@mongolian-payment/pass";

// In your webhook handler
const webhook = PassClient.parseWebhook(req.body);
if (webhook.operation === WebhookOperationPayment && webhook.is_success) {
  // Payment successful
}
```

## Constants

```typescript
import {
  OrderInquiryStatusPaid,     // "paid"
  OrderInquiryStatusPending,  // "pending"
  OrderInquiryStatusCancelled, // "cancelled"
  OrderInquiryStatusVoided,   // "voided"
  WebhookOperationPayment,    // "payment"
  WebhookOperationVoid,       // "void"
} from "@mongolian-payment/pass";
```

## Error Handling

All API methods throw `PassError` on failure.

```typescript
import { PassClient, PassError } from "@mongolian-payment/pass";

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
