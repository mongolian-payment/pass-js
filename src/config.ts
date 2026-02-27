import type { PassConfig } from "./types.js";

/**
 * Load Pass configuration from environment variables.
 *
 * Required environment variables:
 *  - PASS_ENDPOINT
 *  - PASS_ECOMMERCE_TOKEN
 *  - PASS_CALLBACK
 *
 * @throws {Error} if any required variable is missing.
 */
export function loadConfigFromEnv(): PassConfig {
  const endpoint = process.env.PASS_ENDPOINT;
  const ecommerceToken = process.env.PASS_ECOMMERCE_TOKEN;
  const callback = process.env.PASS_CALLBACK;

  if (!endpoint) {
    throw new Error("Missing environment variable: PASS_ENDPOINT");
  }
  if (!ecommerceToken) {
    throw new Error("Missing environment variable: PASS_ECOMMERCE_TOKEN");
  }
  if (!callback) {
    throw new Error("Missing environment variable: PASS_CALLBACK");
  }

  return { endpoint, ecommerceToken, callback };
}
