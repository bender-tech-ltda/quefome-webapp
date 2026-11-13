import type { Cents } from "./money";

/**
 * Structural catalog types used by the pricing/validation rules.
 * They intentionally mirror (but do not import) the API contract so this package stays dependency-free.
 */

/** How a multi-flavor product (e.g. pizza meio-a-meio) is charged. Legacy default: SUM. */
export type FlavorBilling = "SUM" | "HIGHEST_PRICE" | "AVERAGE_PRICE";

export interface CatalogFlavor {
  id: string;
  name: string;
  priceCents: Cents | null;
}

/** Legacy "boolean component": an extra that is either on or off (e.g. "Bacon +R$4"). */
export interface CatalogToggleComponent {
  kind: "toggle";
  id: string;
  name: string;
  /** Visual group (legacy `category`), e.g. "Adicionais". */
  group: string;
  groupSequence: number;
  sequence: number;
  priceCents: Cents | null;
  defaultOn: boolean;
}

export interface CatalogOption {
  id: string;
  name: string;
  priceCents: Cents | null;
  isDefault: boolean;
  sequence: number;
}

/** Legacy "component with options": a single choice (radio) group, e.g. "Borda". */
export interface CatalogChoiceComponent {
  kind: "choice";
  id: string;
  name: string;
  sequence: number;
  options: CatalogOption[];
}

export type CatalogComponent = CatalogToggleComponent | CatalogChoiceComponent;

export interface CatalogProduct {
  id: string;
  name: string;
  priceCents: Cents;
  flavorBilling: FlavorBilling;
  /** Maximum number of flavors; null = no limit (legacy: undefined flavorsAmount). */
  maxFlavors: number | null;
  flavors: CatalogFlavor[];
  components: CatalogComponent[];
}

export type ComponentSelection =
  | { componentId: string; on: boolean }
  | { componentId: string; optionId: string | null };

/** What the customer chose. This is also the shape sent to the API (ids only, never prices). */
export interface ItemSelection {
  productId: string;
  quantity: number;
  instructions: string;
  flavorIds: string[];
  components: ComponentSelection[];
}

export function isToggleSelection(s: ComponentSelection): s is { componentId: string; on: boolean } {
  return "on" in s;
}

/** Default selection when opening the customize dialog (legacy groupProductComponents side-effects). */
export function defaultSelection(product: CatalogProduct): ItemSelection {
  return {
    productId: product.id,
    quantity: 1,
    instructions: "",
    flavorIds: [],
    components: product.components.map((c) =>
      c.kind === "toggle"
        ? { componentId: c.id, on: c.defaultOn }
        : { componentId: c.id, optionId: c.options.find((o) => o.isDefault)?.id ?? null },
    ),
  };
}

export interface ComponentGroup {
  name: string;
  sequence: number;
  components: CatalogComponent[];
}

const bySequenceThenName = <T extends { sequence: number; name: string }>(a: T, b: T) =>
  a.sequence - b.sequence || a.name.localeCompare(b.name, "pt-BR");

/**
 * Legacy grouping for the customize dialog:
 * - each choice component is its own group, named after the component;
 * - toggle components are grouped by their `group` (legacy `category`).
 * Groups and components are ordered by [sequence, name].
 */
export function groupComponents(product: Pick<CatalogProduct, "components">): ComponentGroup[] {
  const groups = new Map<string, ComponentGroup>();
  for (const component of product.components) {
    const key = component.kind === "choice" ? `choice:${component.name}` : `toggle:${component.group}`;
    let group = groups.get(key);
    if (!group) {
      group =
        component.kind === "choice"
          ? { name: component.name, sequence: component.sequence, components: [] }
          : { name: component.group, sequence: component.groupSequence, components: [] };
      groups.set(key, group);
    }
    group.components.push(component);
  }
  const result = [...groups.values()].sort(bySequenceThenName);
  for (const group of result) group.components.sort(bySequenceThenName);
  return result;
}

export function sortOptions(options: CatalogOption[]): CatalogOption[] {
  return [...options].sort(bySequenceThenName);
}

export interface MenuCategory {
  id: string;
  name: string;
  icon: string | null;
  sequence: number;
}

export interface MenuSection<P> {
  category: MenuCategory;
  products: P[];
}

/** Legacy EstablishmentController.groupProducts + `orderBy: ['sequence','name']`. Empty categories are dropped. */
export function groupMenu<P extends { categoryId: string }>(categories: MenuCategory[], products: P[]): MenuSection<P>[] {
  return [...categories]
    .sort(bySequenceThenName)
    .map((category) => ({ category, products: products.filter((p) => p.categoryId === category.id) }))
    .filter((section) => section.products.length > 0);
}
