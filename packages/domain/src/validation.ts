import { type CatalogProduct, type ItemSelection, isToggleSelection } from "./catalog";
import { type Cents, formatMoney } from "./money";
import type { PaymentKind } from "./payment";
import { isBrazilianMobile } from "./phone";
import type { Fulfillment } from "./pricing";

// ---------------------------------------------------------------------------
// Item (customize dialog) — legacy CustomizeProductController.isOrderItemValid
// ---------------------------------------------------------------------------

export type ItemIssue =
  | "FLAVOR_REQUIRED"
  | "TOO_MANY_FLAVORS"
  | "QUANTITY_REQUIRED"
  | "QUANTITY_INVALID"
  | "UNKNOWN_REFERENCE";

export const ITEM_ISSUE_MESSAGES: Record<ItemIssue, string> = {
  FLAVOR_REQUIRED: "Você precisa escolher pelo menos um sabor!",
  TOO_MANY_FLAVORS: "Você escolheu mais sabores do que o permitido.",
  QUANTITY_REQUIRED: "Você precisa informar uma quantidade!",
  QUANTITY_INVALID: "Você precisa informar uma quantidade maior que zero!",
  UNKNOWN_REFERENCE: "Esse produto foi alterado. Por favor, monte-o novamente.",
};

export function validateItem(product: CatalogProduct, selection: ItemSelection): ItemIssue[] {
  const issues: ItemIssue[] = [];
  if (product.flavors.length > 0 && selection.flavorIds.length === 0) issues.push("FLAVOR_REQUIRED");
  if (product.maxFlavors !== null && selection.flavorIds.length > product.maxFlavors) issues.push("TOO_MANY_FLAVORS");
  if (selection.quantity === null || selection.quantity === undefined || Number.isNaN(selection.quantity)) {
    issues.push("QUANTITY_REQUIRED");
  } else if (!Number.isInteger(selection.quantity) || selection.quantity < 1) {
    issues.push("QUANTITY_INVALID");
  }
  const unknownFlavor = selection.flavorIds.some((id) => !product.flavors.some((f) => f.id === id));
  const unknownComponent = selection.components.some((chosen) => {
    const component = product.components.find((c) => c.id === chosen.componentId);
    if (!component) return true;
    if (component.kind === "choice" && !isToggleSelection(chosen) && chosen.optionId) {
      return !component.options.some((o) => o.id === chosen.optionId);
    }
    return false;
  });
  if (unknownFlavor || unknownComponent) issues.push("UNKNOWN_REFERENCE");
  return issues;
}

/** Legacy isFlavorDisabled: can't tick another flavor once the limit is reached. */
export function isFlavorDisabled(product: Pick<CatalogProduct, "maxFlavors">, selectedCount: number, isSelected: boolean): boolean {
  return !isSelected && product.maxFlavors !== null && selectedCount >= product.maxFlavors;
}

/** Legacy customize.html warnings under the "Sabores (n/max)" legend. */
export function flavorHint(product: Pick<CatalogProduct, "maxFlavors">, selectedCount: number): { level: "error" | "warning"; text: string } | null {
  if (selectedCount === 0) return { level: "error", text: ITEM_ISSUE_MESSAGES.FLAVOR_REQUIRED };
  if (product.maxFlavors === 1) return { level: "warning", text: "Você pode escolher somente um sabor" };
  if (product.maxFlavors !== null && product.maxFlavors > 1) return { level: "warning", text: `Você pode escolher até ${product.maxFlavors} sabores` };
  return null;
}

// ---------------------------------------------------------------------------
// Cart — legacy EstablishmentController.isOrderInvalid / getInvalidOrderMessage
// ---------------------------------------------------------------------------

export interface CartState {
  storeOpen: boolean;
  itemCount: number;
  /** Subtotal WITHOUT the delivery fee — the legacy minimum-order rule ignores the fee. */
  subtotalCents: Cents;
  minimumOrderCents: Cents | null;
}

export type CartIssue = "STORE_CLOSED" | "BELOW_MINIMUM" | "EMPTY";

export function cartIssues(state: CartState): CartIssue[] {
  const issues: CartIssue[] = [];
  if (!state.storeOpen) issues.push("STORE_CLOSED");
  if (state.minimumOrderCents && state.subtotalCents < state.minimumOrderCents) issues.push("BELOW_MINIMUM");
  if (state.itemCount === 0) issues.push("EMPTY");
  return issues;
}

/** First message, in the exact legacy priority: closed -> minimum -> empty. */
export function cartIssueMessage(state: CartState): string {
  const [first] = cartIssues(state);
  switch (first) {
    case "STORE_CLOSED":
      return "O estabelecimento está fechado no momento.";
    case "BELOW_MINIMUM":
      return `Esse estabelecimento só aceita pedidos acima de R$ ${formatMoney(state.minimumOrderCents)} (sem o custo da tele-entrega).`;
    case "EMPTY":
      return "Você precisa adicionar pelo menos um produto para fazer seu pedido.";
    default:
      return "";
  }
}

// ---------------------------------------------------------------------------
// Checkout (guest: name + WhatsApp, no account)
// ---------------------------------------------------------------------------

export interface CheckoutState {
  fulfillment: Fulfillment;
  /** Address found (CEP/street lookup or typed manually) and the store delivers there. */
  address: { found: boolean; attended: boolean; number: string } | null;
  customerName: string;
  whatsapp: string;
  paymentKind: PaymentKind | null;
  changeForCents: Cents | null;
  totalCents: Cents;
}

export type CheckoutIssue =
  | "ADDRESS_REQUIRED"
  | "ADDRESS_NOT_ATTENDED"
  | "ADDRESS_NUMBER_REQUIRED"
  | "NAME_REQUIRED"
  | "WHATSAPP_REQUIRED"
  | "WHATSAPP_INVALID"
  | "PAYMENT_REQUIRED"
  | "CHANGE_TOO_LOW";

export const CHECKOUT_ISSUE_MESSAGES: Record<CheckoutIssue, string> = {
  ADDRESS_REQUIRED: "Informe o endereço de entrega.",
  ADDRESS_NOT_ATTENDED: "O restaurante não entrega nesse endereço.",
  ADDRESS_NUMBER_REQUIRED: "Informe o número do endereço.",
  NAME_REQUIRED: "Informe seu nome.",
  WHATSAPP_REQUIRED: "Informe seu WhatsApp para receber as atualizações do pedido.",
  WHATSAPP_INVALID: "Informe um celular com DDD, por exemplo (51) 99999-8888.",
  PAYMENT_REQUIRED: "Escolha a forma de pagamento.",
  CHANGE_TOO_LOW: "O valor para troco deve ser maior que o total do pedido.",
};

/** Issues in the order they appear on the page. */
export function checkoutIssues(state: CheckoutState): CheckoutIssue[] {
  const issues: CheckoutIssue[] = [];
  if (state.fulfillment === "DELIVERY") {
    if (!state.address?.found) issues.push("ADDRESS_REQUIRED");
    else if (!state.address.attended) issues.push("ADDRESS_NOT_ATTENDED");
    else if (!state.address.number.trim()) issues.push("ADDRESS_NUMBER_REQUIRED");
  }
  if (!state.customerName.trim()) issues.push("NAME_REQUIRED");
  if (!state.whatsapp.trim()) issues.push("WHATSAPP_REQUIRED");
  else if (!isBrazilianMobile(state.whatsapp)) issues.push("WHATSAPP_INVALID");
  if (!state.paymentKind) issues.push("PAYMENT_REQUIRED");
  if (state.paymentKind === "CASH" && state.changeForCents !== null && state.changeForCents < state.totalCents) issues.push("CHANGE_TOO_LOW");
  return issues;
}
