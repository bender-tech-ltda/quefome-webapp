"use client";

import type { CuisineType } from "@quefome/contract";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";

/** Legacy food-type toggles: selecting a type clears the text query (and vice versa). */
export function CuisineFilter({ cuisineTypes, selected }: { cuisineTypes: CuisineType[]; selected: string | null }) {
  const router = useRouter();
  return (
    <ul className="food-type-list">
      {cuisineTypes.map((type) => {
        const active = selected === type.slug;
        return (
          <li key={type.id} className={`helper-no-select${active ? " active" : ""}`} title={type.name}>
            <button
              type="button"
              className="product-type-button"
              aria-pressed={active}
              aria-label={`Filtrar por ${type.name}`}
              onClick={() => router.push(active ? "/restaurantes" : `/restaurantes/${type.slug}`)}
            >
              <Icon name={type.icon ?? "question"} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
