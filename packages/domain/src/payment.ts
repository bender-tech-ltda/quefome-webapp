/**
 * MVP payment: paid directly to the restaurant (no gateway, no commission).
 * CASH (with optional change/"troco"), PIX (manual transfer to the store's key), CARD (on delivery).
 */
export type PaymentKind = "CASH" | "PIX" | "CARD";

export interface PixSettings {
  keyType: "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "RANDOM";
  key: string;
  holderName: string;
}

export interface PaymentSettings {
  cash: boolean;
  card: boolean;
  pix: PixSettings | null;
}

export const PAYMENT_LABELS: Record<PaymentKind, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  CARD: "Cartão na entrega",
};

export function availablePaymentKinds(settings: PaymentSettings): PaymentKind[] {
  const kinds: PaymentKind[] = [];
  if (settings.pix) kinds.push("PIX");
  if (settings.card) kinds.push("CARD");
  if (settings.cash) kinds.push("CASH");
  return kinds;
}

export const allowsChange = (kind: PaymentKind) => kind === "CASH";

export const PIX_KEY_TYPE_LABELS: Record<PixSettings["keyType"], string> = {
  CPF: "CPF",
  CNPJ: "CNPJ",
  EMAIL: "E-mail",
  PHONE: "Telefone",
  RANDOM: "Chave aleatória",
};
