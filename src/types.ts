// ── Configuration ──

export interface PassConfig {
  /** Base URL of the Pass API */
  endpoint: string;
  /** E-commerce token for authentication */
  ecommerceToken: string;
  /** Callback URL for order notifications */
  callback: string;
}

// ── Constants ──

export const OrderInquiryStatusPaid = "paid" as const;
export const OrderInquiryStatusPending = "pending" as const;
export const OrderInquiryStatusCancelled = "cancelled" as const;
export const OrderInquiryStatusVoided = "voided" as const;

export type OrderInquiryStatus =
  | typeof OrderInquiryStatusPaid
  | typeof OrderInquiryStatusPending
  | typeof OrderInquiryStatusCancelled
  | typeof OrderInquiryStatusVoided;

export const WebhookOperationPayment = "payment" as const;
export const WebhookOperationVoid = "void" as const;

export type WebhookOperation =
  | typeof WebhookOperationPayment
  | typeof WebhookOperationVoid;

// ── Base error ──

export interface BaseError {
  code: string;
  level: string;
  body: string;
}

// ── Create Order ──

export interface CreateOrderInput {
  ecommerce_token: string;
  amount: number;
  callback_url: string;
}

export interface RetCreateOrder {
  shop: string;
  amount: string;
  order_id: string;
  order_ttl: number;
  db_ref_no: string;
}

export interface CreateOrderResponse {
  status_code: string;
  ret?: RetCreateOrder;
  msg?: BaseError;
}

// ── Order Inquiry ──

export interface OrderInquiryInput {
  ecommerce_token: string;
  order_id: string;
}

export interface CustomerData {
  user_id: string;
  unique_id: string;
}

export interface LoyaltyData {
  kb_status: string;
  kb_txn_id: string;
  kb_card_id: string;
  kb_usable_lp: string;
  kb_loyalty_pk: string;
  has_kb_loyalty: string;
  kb_description: string;
  kb_limit_value: string;
  kb_loyalty_type: string;
  kb_dates_of_week: string;
  kb_no_txn_amount: string;
  kb_yes_txn_amount: string;
  kb_loyalty_provider_name: string;
}

export interface ExtraData {
  _id: string;
  pan: string;
  rrn: string;
  amount: string;
  pos_id: string;
  order_id: string;
  resp_msg: string;
  trace_no: string;
  date_time: string;
  resp_code: string;
  terminal_id: string;
  approved_code: string;
  currency_code: string;
  payment_request_id: string;
}

export interface RetInquiryOrder {
  resp_code: string;
  resp_msg: string;
  status: string;
  amount: string;
  customer_data?: CustomerData;
  loyalty_data?: LoyaltyData;
  db_ref_no: string;
  extra_data?: ExtraData;
  status_text: string;
}

export interface OrderInquiryResponse {
  status_code: string;
  ret?: RetInquiryOrder;
  msg?: BaseError;
}

// ── Order Notify ──

export interface OrderNotifyInput {
  ecommerce_token: string;
  order_id: string;
  phone: string;
}

export interface Datum {
  success: boolean;
  message_id: string;
}

export interface RetNotifyOrder {
  resp_code: string;
  resp_msg: string;
  success: number;
  data: Datum[];
}

export interface OrderNotifyResponse {
  status_code: string;
  ret?: RetNotifyOrder;
  msg?: BaseError;
}

// ── Order Cancel ──

export interface OrderCancelInput {
  ecommerce_token: string;
  order_id: string;
}

export interface RetOrderCancel {
  resp_code: string;
  resp_msg: string;
  status: string;
  amount: string;
  loyalty_data: unknown;
  db_ref_no: string;
}

export interface OrderCancelResponse {
  status_code: string;
  ret?: RetOrderCancel;
  msg?: BaseError;
}

// ── Order Void ──

export interface OrderVoidInput {
  ecommerce_token: string;
  order_id: string;
}

export interface RetOrderVoid {
  resp_code: string;
  resp_msg: string;
  status: string;
  amount: string;
  loyalty_data: unknown;
  db_ref_no: string;
  service_name: string;
  date_time: string;
  trace_no: string;
  rrn: string;
  terminal_id: string;
  merchant_id: string;
}

export interface OrderVoidResponse {
  status_code: string;
  ret?: RetOrderVoid;
  msg?: BaseError;
}

// ── Webhook ──

export interface WebhookCallbackResponse {
  order_id: string;
  payment_request_id: string;
  pos_id: string;
  operation: string;
  is_success: boolean;
  amount: string;
  created_time: string;
  customer_data?: CustomerData;
  extra_data?: Record<string, string>;
  db_ref_no: string;
}
