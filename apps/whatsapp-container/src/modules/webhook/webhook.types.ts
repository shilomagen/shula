/**
 * Represents a generic webhook payload
 */
export interface WebhookPayload {
  [key: string]: any;
}

/**
 * Represents the response from a webhook endpoint
 */
export interface WebhookResponse {
  success: boolean;
}
