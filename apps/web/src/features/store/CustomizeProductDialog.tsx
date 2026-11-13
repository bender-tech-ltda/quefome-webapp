"use client";

import type { Product } from "@quefome/contract";
import {
  type ComponentSelection,
  type ItemSelection,
  ITEM_ISSUE_MESSAGES,
  defaultSelection,
  flavorHint,
  formatMoney,
  groupComponents,
  isFlavorDisabled,
  isToggleSelection,
  itemTotalCents,
  sortOptions,
  validateItem,
} from "@quefome/domain";
import { type FormEvent, useState } from "react";
import { Modal } from "@/components/Modal";

/** Legacy customize.html + CustomizeProductController (now using the shared domain pricing). */
export function CustomizeProductDialog({
  product,
  initial,
  onConfirm,
  onClose,
}: {
  product: Product;
  /** Present when editing a cart line (legacy extractOrderItem). */
  initial?: ItemSelection;
  onConfirm: (selection: ItemSelection) => void;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose} title={`Personalizar ${product.name}`}>
      <CustomizeProductForm product={product} initial={initial} onConfirm={onConfirm} onClose={onClose} />
    </Modal>
  );
}

export function CustomizeProductForm({
  product,
  initial,
  onConfirm,
  onClose,
}: {
  product: Product;
  initial?: ItemSelection;
  onConfirm: (selection: ItemSelection) => void;
  onClose: () => void;
}) {
  const [selection, setSelection] = useState<ItemSelection>(() => initial ?? defaultSelection(product));
  const [quantityText, setQuantityText] = useState(String((initial ?? defaultSelection(product)).quantity));

  const quantity = quantityText.trim() === "" ? Number.NaN : Number(quantityText);
  const current: ItemSelection = { ...selection, quantity };
  const issues = validateItem(product, current);
  const groups = groupComponents(product);
  const hint = product.flavors.length > 0 ? flavorHint(product, selection.flavorIds.length) : null;
  const total = itemTotalCents(product, current);

  const toggleFlavor = (id: string, checked: boolean) =>
    setSelection((s) => ({ ...s, flavorIds: checked ? [...s.flavorIds, id] : s.flavorIds.filter((f) => f !== id) }));

  const setComponent = (next: ComponentSelection) =>
    setSelection((s) => ({ ...s, components: s.components.map((c) => (c.componentId === next.componentId ? next : c)) }));

  const chosen = (componentId: string) => selection.components.find((c) => c.componentId === componentId);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (issues.length === 0) onConfirm(current);
  };

  return (
    <form className="customize-product-dialog" name="productForm" onSubmit={submit} noValidate>
      <div className="modal-body">
        <div className="product">
          <div className="info">
            <h3 className="name">{product.name}</h3>
            <p className="description">{product.description}</p>
          </div>
        </div>

        {(groups.length > 0 || product.flavors.length > 0) && (
          <div className="product-details">
            {product.flavors.length > 0 && (
              <fieldset className="flavors">
                <legend className="title">
                  <span>
                    Sabores ({selection.flavorIds.length}/{product.maxFlavors ?? product.flavors.length})
                  </span>
                  {hint && <p className={hint.level}>{hint.text}</p>}
                </legend>
                {[...product.flavors]
                  .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
                  .map((flavor) => {
                    const selected = selection.flavorIds.includes(flavor.id);
                    const disabled = isFlavorDisabled(product, selection.flavorIds.length, selected);
                    return (
                      <div key={flavor.id} className={`flavor checkbox${disabled ? " disabled" : ""}`}>
                        <label>
                          <input type="checkbox" checked={selected} disabled={disabled} onChange={(e) => toggleFlavor(flavor.id, e.target.checked)} />
                          <span>{flavor.name}</span>
                          {!!flavor.priceCents && flavor.priceCents > 0 && <p className="price"> + R$ {formatMoney(flavor.priceCents)}</p>}
                        </label>
                      </div>
                    );
                  })}
              </fieldset>
            )}

            {groups.map((group) => (
              <fieldset key={group.name} className="component-category">
                <legend className="title">{group.name}</legend>
                {group.components.map((component) => (
                  <div key={component.id} className="component">
                    {component.kind === "toggle" ? (
                      <div className="checkbox">
                        <label>
                          <input
                            type="checkbox"
                            checked={(() => {
                              const c = chosen(component.id);
                              return !!c && isToggleSelection(c) && c.on;
                            })()}
                            onChange={(e) => setComponent({ componentId: component.id, on: e.target.checked })}
                          />
                          <span>{component.name}</span>
                          {!!component.priceCents && component.priceCents > 0 && <p className="price"> + R$ {formatMoney(component.priceCents)}</p>}
                        </label>
                      </div>
                    ) : (
                      sortOptions(component.options).map((option) => {
                        const c = chosen(component.id);
                        return (
                          <div key={option.id} className="radio">
                            <label>
                              <input
                                type="radio"
                                name={`component-${component.id}`}
                                checked={!!c && !isToggleSelection(c) && c.optionId === option.id}
                                onChange={() => setComponent({ componentId: component.id, optionId: option.id })}
                              />
                              <span>{option.name}</span>
                              {!!option.priceCents && option.priceCents > 0 && <p className="price">+ R$ {formatMoney(option.priceCents)}</p>}
                            </label>
                          </div>
                        );
                      })
                    )}
                  </div>
                ))}
              </fieldset>
            ))}
          </div>
        )}
      </div>

      <div className="modal-footer">
        <div className="instructions">
          <label htmlFor="item-instructions">Instruções adicionais</label>
          <textarea
            id="item-instructions"
            className="form-control"
            name="instructions"
            maxLength={500}
            placeholder="Sabe aquele detalhezinho que você gosta do seu jeito? Escreve aí! ;)"
            value={selection.instructions}
            onChange={(e) => setSelection((s) => ({ ...s, instructions: e.target.value }))}
          />
        </div>

        <div className="quantity">
          <label htmlFor="item-quantity">Quantidade:</label>
          <input
            id="item-quantity"
            type="number"
            inputMode="numeric"
            className="form-control"
            name="quantity"
            min={1}
            step={1}
            value={quantityText}
            onChange={(e) => setQuantityText(e.target.value.replace(/[^0-9]/g, ""))}
          />
        </div>

        <div className="total">
          <b>Total:</b> <span className="price">R$ {formatMoney(total)}</span>
        </div>

        <div className="clearfix" />

        <div className="error-messages" aria-live="polite">
          {issues.includes("FLAVOR_REQUIRED") && <span>{ITEM_ISSUE_MESSAGES.FLAVOR_REQUIRED}</span>}
          {issues.includes("QUANTITY_REQUIRED") && <span>{ITEM_ISSUE_MESSAGES.QUANTITY_REQUIRED}</span>}
          {issues.includes("QUANTITY_INVALID") && <span>{ITEM_ISSUE_MESSAGES.QUANTITY_INVALID}</span>}
        </div>

        <button type="submit" className="btn btn-primary btn-add-product" disabled={issues.length > 0}>
          {initial ? "Atualizar item" : "Adicionar ao Pedido"}
        </button>
        <br />
        <button type="button" className="btn btn-cancel" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
