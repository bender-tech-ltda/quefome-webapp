import { onlyDigits } from "./format";

/**
 * WhatsApp numbers are the customer identity and the notification channel, so they must be
 * Brazilian mobiles: DDD (11-99) + 9 digits starting with 9. Normalized to E.164 ("+5551999998888").
 * Accepts "51 99999-8888", "(51) 99999-8888", "+55 51 99999 8888", "5551999998888".
 */
export function normalizeBrazilianMobile(input: string | null | undefined): string | null {
  if (!input) return null;
  let digits = onlyDigits(input);
  if (digits.length === 13 && digits.startsWith("55")) digits = digits.slice(2);
  if (digits.length === 12 && digits.startsWith("0")) digits = digits.slice(1); // "0 51 9..." carrier-style prefix
  if (digits.length !== 11) return null;
  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99 || digits[2] !== "9") return null;
  return `+55${digits}`;
}

export function isBrazilianMobile(input: string | null | undefined): boolean {
  return normalizeBrazilianMobile(input) !== null;
}

/**
 * Store numbers: mobile (11 digits) or landline (10 digits, WhatsApp Business verified by voice call).
 */
export function normalizeBrazilianPhone(input: string | null | undefined): string | null {
  const mobile = normalizeBrazilianMobile(input);
  if (mobile) return mobile;
  if (!input) return null;
  let digits = onlyDigits(input);
  if (digits.length === 12 && digits.startsWith("55")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length !== 10) return null;
  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99 || !/[2-5]/.test(digits[2]!)) return null; // landlines start with 2-5
  return `+55${digits}`;
}
