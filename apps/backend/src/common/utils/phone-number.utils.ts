/**
 * Utility functions for phone number formatting and validation
 */

/**
 * Formats a phone number to ensure it has a consistent format with a leading +
 * Removes any WhatsApp specific formatting if present (e.g., number@s.whatsapp.net)
 *
 * @param phoneNumber - The phone number to format
 * @returns The formatted phone number with a leading +
 */
export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) {
    return '';
  }

  // Remove any WhatsApp specific formatting if present
  const cleanedNumber = phoneNumber.includes('@')
    ? phoneNumber.split('@')[0]
    : phoneNumber;

  // Ensure it starts with + for international format
  return cleanedNumber.startsWith('+') ? cleanedNumber : `+${cleanedNumber}`;
}
