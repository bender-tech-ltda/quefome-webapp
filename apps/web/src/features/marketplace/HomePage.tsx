import type { CuisineType } from "@quefome/contract";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { brand } from "@/lib/config";
import { StoreNameSearch } from "./StoreNameSearch";

/** Legacy home/index.html (marketplace entry: kept as a secondary channel). Server component. */
export function HomePage({ cuisineTypes, banner }: { cuisineTypes: CuisineType[]; banner: "banner-burger" | "banner-pizza" }) {
  const featured = cuisineTypes.filter((t) => t.featured).sort((a, b) => a.sequence - b.sequence || a.name.localeCompare(b.name, "pt-BR"));
  return (
    <div className="home-page" itemScope itemType="http://schema.org/WebSite">
      <meta itemProp="url" content={`${brand.siteUrl}/`} />
      <div className={`delivery-search-panel ${banner}`}>
        <div className="food-type-search" itemScope itemType="http://schema.org/ItemList">
          <h3 className="title" itemProp="name">Você tem fome de quê?</h3>
          <ul className="food-type-list">
            {featured.map((type) => (
              <li key={type.id} className="helper-no-select" itemProp="itemListElement" itemScope itemType="https://schema.org/SomeProducts">
                <Link href={`/restaurantes/${type.slug}`} itemProp="url">
                  <Icon name={type.icon ?? "question"} />
                  <h2 className="food-type-name" itemProp="name">{type.name}</h2>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <StoreNameSearch variant="home" />
        <div className="clearfix" />
      </div>

      <div className="order-process-panel">
        <h4 className="title">Como funciona?</h4>
        <div className="divider" />
        <div className="step choose-establishment-step">
          <Icon name="restaurant" />
          <h6>Escolha um restaurante</h6>
        </div>
        <div className="next-step-divider">
          <Icon name="arrow-next" />
        </div>
        <div className="step customize-order-step">
          <Icon name="order-check" />
          <h6>Monte seu pedido</h6>
        </div>
        <div className="next-step-divider">
          <Icon name="arrow-next" />
        </div>
        <div className="step wait-order-step">
          <Icon name="food" />
          <h6>E espere ele ficar pronto</h6>
        </div>
        <div className="clearfix" />
      </div>
    </div>
  );
}
