import type { CuisineType, StoreSummary } from "@quefome/contract";
import { deliveryTimeLabel, formatMoney, scheduleLabel, storeStatusLabel } from "@quefome/domain";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { brand } from "@/lib/config";
import { CuisineFilter } from "./CuisineFilter";
import { StoreNameSearch } from "./StoreNameSearch";

/** Legacy establishments/search.html + SearchEstablishmentController. Server component; filters navigate. */
export function SearchPage({ cuisineTypes, selected, query, results }: { cuisineTypes: CuisineType[]; selected: string | null; query: string; results: StoreSummary[] }) {
  const count = results.length;
  return (
    <div className="delivery-search-page">
      <ol className="breadcrumb" itemScope itemType="http://schema.org/BreadcrumbList">
        <li itemProp="itemListElement" itemScope itemType="http://schema.org/ListItem">
          <Link href="/" itemProp="item">
            <span itemProp="name">{brand.name}</span>
          </Link>
          <meta itemProp="position" content="1" />
        </li>
        <li className="active" itemProp="itemListElement" itemScope itemType="http://schema.org/ListItem">
          <Link href="/restaurantes" itemProp="item">
            <span itemProp="name">Estabelecimentos</span>
          </Link>
          <meta itemProp="position" content="2" />
        </li>
      </ol>

      <div className="search-form">
        <div className="food-type-choice">
          <h3 className="title">Escolha o tipo de comida</h3>
          <CuisineFilter cuisineTypes={cuisineTypes.filter((t) => t.featured)} selected={selected} />
        </div>
        <div className="search-form-divisor">
          <span className="divisor-text">ou</span>
        </div>
        <StoreNameSearch variant="search" initialQuery={query} />
        <div className="clearfix" />
      </div>

      <div className="search-result" itemScope itemType="https://schema.org/ItemList">
        <meta itemProp="name" content="Lista de estabelecimentos" />
        <div className="panel panel-default">
          <div className="panel-heading" role="status">
            {count === 0 ? "Nenhum estabelecimento encontrado" : count === 1 ? "1 estabelecimento encontrado" : `${count} estabelecimentos encontrados`}
            <meta itemProp="numberOfItems" content={String(count)} />
          </div>
          <div className="panel-body">
            {count > 0 ? (
              <ul className="establishment-list">
                {results.map((store) => {
                  const open = store.status === "OPEN";
                  return (
                    <li id={store.slug} key={store.id} className="establishment" itemProp="itemListElement" itemScope itemType="https://schema.org/FoodEstablishment">
                      <Link href={`/${store.slug}`} itemProp="url">
                        {/* eslint-disable-next-line @next/next/no-img-element -- legacy CSS sizes it */}
                        <img className="logo img-circle" src={store.imageUrl ?? "/assets/img/no_image_200x200.jpg"} alt="" itemProp="logo" />
                        <div className="information">
                          <div className="title">
                            <h2 className="name" itemProp="name">{store.name}</h2>
                            <p className="address">
                              <Icon name="location" />
                              {store.address.street}, Nº {store.address.number}, Bairro {store.address.neighborhood}
                            </p>
                          </div>
                          <div className="additional-info">
                            <div className={`status ${open ? "open" : "closed"}`} title="Horário de Funcionamento">
                              <Icon name={open ? "event-open" : "event-closed"} /> <span className="text">{storeStatusLabel(store.status)} </span>
                              {store.currentSchedule && <span className="schedule"> ({scheduleLabel(store.status, store.currentSchedule, new Date(), store.timeZone)})</span>}
                            </div>
                            <div className="delivery-info" title="Tempo e custo de entrega">
                              <Icon name="bike" />{" "}
                              <span>
                                {deliveryTimeLabel(store.deliveryTime.minMinutes, store.deliveryTime.maxMinutes)} - R$ {formatMoney(store.deliveryFeeCents)}
                              </span>
                            </div>
                            <div className="clearfix" />
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="no-establishment-found">
                <p>Nenhum estabelecimento encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
