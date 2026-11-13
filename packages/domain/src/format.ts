/** Digits only. */
export function onlyDigits(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

/**
 * Brazilian phone formatting (legacy `phone` filter, FIXED for 9-digit mobiles — defect #6).
 *   8 digits  -> 3333-4444         9 digits  -> 99999-8888
 *   10 digits -> (51) 3333-4444    11 digits -> (51) 99999-8888
 *   12/13 digits starting with 55 -> same as 10/11 without the country code
 * Anything else is returned untouched.
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  let digits = onlyDigits(phone.trim());
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) digits = digits.slice(2);
  switch (digits.length) {
    case 8:
      return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    case 9:
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    case 10:
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    case 11:
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    default:
      return phone;
  }
}

/** Legacy `shortText` filter. */
export function shortText(text: string | null | undefined, size = 100): string {
  if (!text) return "";
  return text.length > size ? `${text.substring(0, size).trim()}...` : text;
}
