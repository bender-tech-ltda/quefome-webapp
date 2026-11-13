/**
 * Money is always an integer number of cents (BRL centavos).
 * Legacy used floating point reais; see docs/adr/0003-money-in-cents.md.
 */
export type Cents = number;

/**
 * Rounds a fractional cents value to an integer.
 *
 * POLICY (TBD in the business-rules refinement): half-up.
 * Legacy had no policy: `42.425.toFixed(2)` showed "42,42" by floating point accident.
 * Changing the policy must only touch this function and its test table.
 */
export function roundCents(value: number): Cents {
  return Math.floor(value + 0.5);
}

/**
 * Legacy `money` filter: two decimals, comma as decimal separator, NO thousands separator.
 * - undefined -> "" (legacy returned "" for undefined)
 * - null/0    -> "0,00"
 */
export function formatMoney(cents: Cents | null | undefined): string {
  if (cents === undefined) return "";
  const value = cents ?? 0;
  const negative = value < 0;
  const abs = Math.abs(Math.trunc(value));
  const reais = Math.floor(abs / 100);
  const centavos = String(abs % 100).padStart(2, "0");
  return `${negative ? "-" : ""}${reais},${centavos}`;
}

/** "R$ 12,50" */
export function formatBRL(cents: Cents | null | undefined): string {
  return `R$ ${formatMoney(cents ?? 0)}`;
}

/** Parses user input like "50", "50,5", "50.50" into cents. Returns null when not a number. */
export function parseMoneyInput(input: string): Cents | null {
  const normalized = input.trim().replace(/\s/g, "").replace(",", ".");
  if (normalized === "" || !/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}
