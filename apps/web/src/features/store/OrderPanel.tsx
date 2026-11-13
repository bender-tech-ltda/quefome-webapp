"use client";

import type { Store } from "@quefome/contract";
import { formatMoney } from "@quefome/domain";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/Icon";
import { useStickyScroll } from "@/components/useStickyScroll";
import type { Cart } from "./useCart";

type Line = Cart["lines"][number];

/** Legacy "Seu Pedido" sticky bottom panel (establishment.html .order-panel). */
export function OrderPanel({
  store,
  cart,
  open,
  onOpenChange,
  onEdit,
  onFinish,
}: {
  store: Store;
  cart: Cart;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (line: Line) => void;
  onFinish: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const sticky = useStickyScroll(ref, "bottom");
  const pushedHistory = useRef(false);

  // legacy: body gets `no-overflow` while the panel is open, and the browser "back" closes the panel
  useEffect(() => {
    document.body.classList.toggle("no-overflow", open);
    if (!open) return;
    window.history.pushState({ qfOrderPanel: true }, "");
    pushedHistory.current = true;
    const onPop = () => {
      pushedHistory.current = false;
      onOpenChange(false);
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      document.body.classList.remove("no-overflow");
    };
  }, [open, onOpenChange]);

  const close = () => {
    if (pushedHistory.current) {
      pushedHistory.current = false;
      window.history.back();
    }
    onOpenChange(false);
  };

  const remove = (line: Line) => {
    if (window.confirm("Deseja remover esse item do seu pedido?")) cart.removeLine(line.lineId);
  };

  return (
    <>
      {sticky.stuck && !open && <div className="sticky-fake" style={{ height: sticky.spacerHeight }} />}
      <div ref={ref} className={`order-panel${open ? " opened" : ""} ${open ? "" : sticky.className}`} aria-label="Seu pedido" role="region">
        <div className="wrapper">
          <div className="header">
            <div className="title-panel">
              <span className="title">Seu Pedido</span>
            </div>
            {!open ? (
              <button type="button" className="btn btn-show-order-details" onClick={() => onOpenChange(true)}>
                <Icon name="cart" /> <span>Finalizar Pedido</span>
              </button>
            ) : (
              <button type="button" className="btn btn-show-order-details" onClick={close}>
                <Icon name="back" /> <span>Continuar comprando</span>
              </button>
            )}
            <div className="total" aria-live="polite">
              <span>Total: R$ {formatMoney(cart.totalCents)}</span>
            </div>
            <div className="clearfix" />

            {open && cart.fulfillment === "DELIVERY" && <div className="delivery-price">Taxa de entrega: R$ {formatMoney(store.deliveryFeeCents)}</div>}

            {open && store.pickupEnabled && store.deliveryEnabled && (
              <div className="delivery-type" role="radiogroup" aria-label="Forma de entrega">
                <div className="radio">
                  <label>
                    <input type="radio" name="cart-fulfillment" checked={cart.fulfillment === "DELIVERY"} onChange={() => cart.setFulfillment("DELIVERY")} /> Tele-entrega
                  </label>
                </div>
                <div className="radio">
                  <label>
                    <input type="radio" name="cart-fulfillment" checked={cart.fulfillment === "PICKUP"} onChange={() => cart.setFulfillment("PICKUP")} /> Retirar no balcão
                  </label>
                </div>
                <div className="clearfix" />
              </div>
            )}

            {open && cart.isInvalid && (
              <div className="alert alert-invalid-order" role="alert">
                <p>Você não pode fazer seu pedido.</p>
                <p>{cart.invalidMessage}</p>
              </div>
            )}

            {open && (
              <button type="button" className="btn btn-primary btn-finish-order" disabled={cart.isInvalid} onClick={onFinish}>
                <span>Finalizar Pedido</span> <Icon name="forward" />
              </button>
            )}
          </div>

          {open && (
            <div className="order-items panel panel-default">
              <div className="panel-heading">
                <h4 className="title">Produtos</h4>
              </div>
              <div className="panel-body">
                {cart.lines.length === 0 && (
                  <div className="no-product-message">
                    <p>Você não adicionou nenhum produto.</p>
                  </div>
                )}
                <ul className="items">
                  {cart.lines.map((line) => (
                    <li className="order-item" key={line.lineId}>
                      <button type="button" className="item-summary-button" onClick={() => onEdit(line)} aria-label={`Editar ${line.product.name}`}>
                        <div className="product-name">{line.product.name}</div>
                        <div className="price">R$ {formatMoney(line.totalCents)}</div>
                        <div className="quantity">Quantidade: {line.selection.quantity}</div>
                      </button>
                      <div className="actions">
                        <button type="button" className="btn btn-link btn-edit-order-item" onClick={() => onEdit(line)}>
                          <Icon name="edit" /> <span>editar</span>
                        </button>
                        <button type="button" className="btn btn-link btn-remove-order-item" onClick={() => remove(line)}>
                          <Icon name="trash" /> <span>remover</span>
                        </button>
                      </div>
                      <div className="clearfix" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
