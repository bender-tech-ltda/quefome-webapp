"use client";

import Link from "next/link";
import type { Menu, Product, Store } from "@quefome/contract";
import {
  type ItemSelection,
  PAYMENT_LABELS,
  deliveryTimeLabel,
  formatMoney,
  groupMenu,
  openingHoursSpec,
  scheduleLabel,
  shortText,
  storeStatusLabel,
} from "@quefome/domain";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { useStickyScroll } from "@/components/useStickyScroll";
import { api } from "@/lib/api";
import { POLLING, brand } from "@/lib/config";
import { CustomizeProductDialog } from "./CustomizeProductDialog";
import { OrderPanel } from "./OrderPanel";
import { useCart } from "./useCart";

type DialogState = { kind: "none" } | { kind: "customize"; product: Product } | { kind: "edit"; lineId: string; product: Product; selection: ItemSelection };

/** Store page (menu + cart). Adding to the cart needs nothing else: address and contact come at checkout. */
export function StorePage({ initialStore, menu }: { initialStore: Store; menu: Menu }) {
  const router = useRouter();
  // legacy refreshParameters(): store status/fees refresh every 5 minutes while the menu is open
  const { data: store = initialStore } = useQuery({
    queryKey: ["store", initialStore.slug],
    queryFn: () => api.getStore(initialStore.slug),
    initialData: initialStore,
    refetchInterval: POLLING.storeParametersMs,
    refetchOnWindowFocus: true, // coming back to the tab re-checks open/closed (e.g. the store just reopened)
  });

  const cart = useCart(store, menu);
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const sections = groupMenu(menu.categories, menu.products);
  const isOpen = store.status === "OPEN";

  const finishOrder = () => {
    setPanelOpen(false);
    router.push(`/${store.slug}/pedido/finalizar`);
  };

  return (
    <>
      <ol className="breadcrumb" itemScope itemType="http://schema.org/BreadcrumbList">
        <li itemProp="itemListElement" itemScope itemType="http://schema.org/ListItem">
          <Link href="/" itemProp="item">
            <span itemProp="name">{brand.name}</span>
          </Link>
          <meta itemProp="position" content="1" />
        </li>
        <li itemProp="itemListElement" itemScope itemType="http://schema.org/ListItem">
          <Link href="/restaurantes" itemProp="item">
            <span itemProp="name">Estabelecimentos</span>
          </Link>
          <meta itemProp="position" content="2" />
        </li>
        <li className="active" itemProp="itemListElement" itemScope itemType="http://schema.org/ListItem">
          <span itemProp="name">{store.name}</span>
          <meta itemProp="position" content="3" />
        </li>
      </ol>

      <div id={store.slug} className="establishment-page" itemScope itemType="https://schema.org/FoodEstablishment">
        <StoreHeader store={store} />

        <CategoryFilter sections={sections.map((s) => s.category)} selected={selectedCategory} onToggle={(id) => setSelectedCategory((c) => (c === id ? null : id))} />

        {!isOpen && (
          <div className="alert alert-establishment-closed" role="status">
            <p>
              <span>Esse estabelecimento está fechado no momento. </span>
              <span>Mas ele </span>
              {store.currentSchedule ? <span>{scheduleLabel(store.status, store.currentSchedule, new Date(), store.timeZone).toLowerCase()}</span> : <span>abrirá mais tarde.</span>}
            </p>
            <Link href="/restaurantes">
              <Icon name="back" /> <span>Voltar para a pesquisa de estabelecimentos</span>
            </Link>
          </div>
        )}

        {cart.removed.length > 0 && (
          <div className="alert alert-warning qf-notice" role="status">
            <p>
              {cart.removed.join(", ")} {cart.removed.length === 1 ? "ficou indisponível e saiu" : "ficaram indisponíveis e saíram"} do seu pedido.
            </p>
            <button type="button" className="btn btn-link" onClick={cart.dismissRemoved}>OK</button>
          </div>
        )}

        {sections
          .filter((s) => !selectedCategory || s.category.id === selectedCategory)
          .map(({ category, products }) => (
            <section className="establishment-products" key={category.id} aria-labelledby={`category-${category.id}`}>
              <h2 className="title" id={`category-${category.id}`}>
                <Icon name={category.icon ?? "question"} /> <span itemProp="servesCuisine">{category.name}</span>
                <meta itemProp="menu" content={products.map((p) => p.name).join(", ")} />
              </h2>
              <ul className="products">
                {products.map((product) => (
                  <li key={product.id} className={`product${product.available ? "" : " unavailable"}`} title={!isOpen ? "Você não pode montar seu pedido, esse estabelecimento está fechado no momento." : undefined} itemProp="owns" itemScope itemType="http://schema.org/Product">
                    {!product.imageUrl && <Icon name={category.icon ?? "question"} className="no-image-icon" />}
                    {/* eslint-disable-next-line @next/next/no-img-element -- legacy CSS sizes these images; next/image comes with the media/CDN work */}
                    <img className="img-thumbnail image" src={product.imageUrl ?? "/assets/img/no_product_image_260x260.jpg"} alt={product.name} itemProp="image" loading="lazy" />
                    <div className="title">
                      <h3 className="name" itemProp="name" title={product.name}>{product.name}</h3>
                      <p className="description" itemProp="description" title={product.description}>{shortText(product.description, 50)}</p>
                    </div>
                    <span className="price" itemProp="offers" itemScope itemType="http://schema.org/Offer">
                      <span itemProp="priceCurrency" content="BRL">R$</span> <span itemProp="price" content={(product.priceCents / 100).toFixed(2)}>{formatMoney(product.priceCents)}</span>
                    </span>
                    {product.available ? (
                      <button type="button" className="btn btn-primary btn-add-product" disabled={!isOpen} onClick={() => setDialog({ kind: "customize", product })} aria-label={`Adicionar ${product.name}`}>
                        <Icon name="plus" /> <span>Adicionar</span>
                      </button>
                    ) : (
                      <button type="button" className="btn btn-default btn-add-product" disabled aria-label={`${product.name} esgotado`}>
                        Esgotado
                      </button>
                    )}
                    <meta itemProp="category" content={category.name} />
                  </li>
                ))}
              </ul>
              <div className="clearfix" />
            </section>
          ))}

        <OrderPanel
          store={store}
          cart={cart}
          open={panelOpen}
          onOpenChange={setPanelOpen}
          onEdit={(line) => setDialog({ kind: "edit", lineId: line.lineId, product: line.product, selection: line.selection })}
          onFinish={finishOrder}
        />
      </div>

      {dialog.kind === "customize" && (
        <CustomizeProductDialog
          product={dialog.product}
          onClose={() => setDialog({ kind: "none" })}
          onConfirm={(selection) => {
            cart.addLine({ product: dialog.product, selection });
            setDialog({ kind: "none" });
          }}
        />
      )}
      {dialog.kind === "edit" && (
        <CustomizeProductDialog
          product={dialog.product}
          initial={dialog.selection}
          onClose={() => setDialog({ kind: "none" })}
          onConfirm={(selection) => {
            cart.replaceLine(dialog.lineId, selection);
            setDialog({ kind: "none" });
          }}
        />
      )}
    </>
  );
}

function StoreHeader({ store }: { store: Store }) {
  const open = store.status === "OPEN";
  return (
    <div className="establishment">
      {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
      <img className="logo img-circle" src={store.imageUrl ?? "/assets/img/no_image_200x200.jpg"} alt={store.name} itemProp="logo" />
      <div className="information">
        <div className="title">
          <h1 className="name" itemProp="name">{store.name}</h1>
          <h2 className="description" itemProp="description">{store.description}</h2>
        </div>
        <h2 className="address" itemProp="address" itemScope itemType="http://schema.org/PostalAddress">
          <Icon name="location" />{" "}
          <span itemProp="streetAddress">
            {store.address.street}, nº {store.address.number}, bairro {store.address.neighborhood}
          </span>
          <meta itemProp="addressLocality" content={store.address.city} />
          <meta itemProp="addressRegion" content={store.address.state} />
          <meta itemProp="addressCountry" content="BRA" />
          <meta itemProp="postalCode" content={store.address.zipCode} />
        </h2>
      </div>
      <div className="additional-info">
        <div className={`status ${open ? "open" : "closed"}`} title="Horário de Funcionamento">
          <Icon name={open ? "event-open" : "event-closed"} /> <span className="text">{storeStatusLabel(store.status)}</span>
          {store.currentSchedule && <span className="schedule"> ({scheduleLabel(store.status, store.currentSchedule, new Date(), store.timeZone)})</span>}
        </div>
        <div className="delivery-info" title="Tempo e custo de entrega">
          <Icon name="bike" />{" "}
          <span>
            {deliveryTimeLabel(store.deliveryTime.minMinutes, store.deliveryTime.maxMinutes)} - R$ {formatMoney(store.deliveryFeeCents)}
          </span>
        </div>
        <div className="price-info" title="Pedido mínimo">
          <Icon name="money" /> <span>Pedido mínimo: R$ {formatMoney(store.minimumOrderCents ?? 0)}</span>
        </div>
        <meta itemProp="currenciesAccepted" content="BRL" />
        <meta itemProp="paymentAccepted" content={store.paymentKinds.map((k) => PAYMENT_LABELS[k]).join(", ")} />
        <meta itemProp="openingHours" content={openingHoursSpec(store.schedules)} />
      </div>
      <div className="clearfix" />
    </div>
  );
}

function CategoryFilter({
  sections,
  selected,
  onToggle,
}: {
  sections: { id: string; name: string; icon: string | null }[];
  selected: string | null;
  onToggle: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const sticky = useStickyScroll(ref, "top");
  return (
    <>
      <div ref={ref} className={`establishment-product-types-panel ${sticky.className}`}>
        <h5 className="title">O que você quer pedir?</h5>
        <ul className="establishment-product-types">
          {sections.map((category) => (
            <li key={category.id} className={`product-type${selected === category.id ? " active" : ""}`}>
              <button type="button" className="product-type-button" title={category.name} aria-pressed={selected === category.id} aria-label={`Filtrar por ${category.name}`} onClick={() => onToggle(category.id)}>
                <Icon name={category.icon ?? "question"} />
              </button>
            </li>
          ))}
        </ul>
        <div className="clearfix" />
      </div>
      {sticky.stuck && <div className="sticky-fake" style={{ height: sticky.spacerHeight }} />}
    </>
  );
}
