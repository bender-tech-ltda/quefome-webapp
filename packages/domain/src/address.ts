import { onlyDigits } from "./format";

export interface Address {
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

/** Legacy input pattern: [0-9]{5}(-){0,1}[0-9]{3} */
export function isValidZipCode(value: string): boolean {
  return /^[0-9]{5}-?[0-9]{3}$/.test(value.trim());
}

export function normalizeZipCode(value: string): string {
  return onlyDigits(value);
}

export function formatZipCode(value: string): string {
  const digits = onlyDigits(value);
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : value;
}

/**
 * Street search normalization (legacy models/Address.js, server side):
 * lower-case, trim, "av."/"av " -> "avenida", "r."/"r " -> "rua", drop everything after the first comma.
 */
export function normalizeStreetQuery(street: string): string {
  let value = street.trim().toLowerCase();
  value = value.replace(/^av\./, "avenida").replace(/^av /, "avenida ").replace(/^r\./, "rua").replace(/^r /, "rua ");
  const comma = value.indexOf(",");
  return comma >= 0 ? value.slice(0, comma) : value;
}

/** One-line address as printed on the ticket / admin detail. Uses the address' own city (no more "Canoas" hard-coding). */
export function formatAddressLine(a: Pick<Address, "street" | "number" | "complement" | "neighborhood">): string {
  const complement = a.complement ? `, compl. ${a.complement}` : "";
  return `${a.street}, nº ${a.number}${complement} - Bairro ${a.neighborhood}`;
}
