import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SearchPage } from "@/features/marketplace/SearchPage";
import { api } from "@/lib/api";
import { brand, pageTitle } from "@/lib/config";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ cuisine?: string[] }>; searchParams: Promise<{ q?: string | string[] }> };

async function resolve({ params, searchParams }: Props) {
  const { cuisine } = await params;
  if (cuisine && cuisine.length > 1) notFound();
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  // legacy: a text query wins over the cuisine filter
  const selected = q ? null : (cuisine?.[0] ?? null);
  const cuisineTypes = await api.listCuisineTypes();
  if (selected && !cuisineTypes.some((t) => t.slug === selected)) notFound();
  return { q, selected, cuisineTypes };
}

/** Legacy routes.js pageInfo for /restaurantes/:productType? + SearchEstablishmentController.updatePageInfo. */
export async function generateMetadata(props: Props): Promise<Metadata> {
  const { q, selected, cuisineTypes } = await resolve(props);
  const type = cuisineTypes.find((t) => t.slug === selected);
  if (type) return { title: `${type.name} - Pesquisa de estabelecimentos - ${brand.name}`, description: `Procurando por ${type.name}? Chega mais que temos restaurantes ultra-master-deliciosos para você!`, alternates: { canonical: `/restaurantes/${type.slug}` } };
  if (q) return { title: `'${q}' - Pesquisa de estabelecimentos - ${brand.name}`, description: `Procurando por '${q}'? Chega mais que temos restaurantes ultra-master-deliciosos para você!`, robots: { index: false } };
  return { title: pageTitle("Procure estabelecimentos"), description: "#partiu procurar o restaurante do seu rango de hoje? Encontre os melhores deliveries da sua cidade.", alternates: { canonical: "/restaurantes" } };
}

export default async function Page(props: Props) {
  const { q, selected, cuisineTypes } = await resolve(props);
  const results = await api.searchStores({ ...(q ? { q } : {}), ...(selected ? { cuisine: selected } : {}) });
  return <SearchPage cuisineTypes={cuisineTypes} selected={selected} query={q} results={results} />;
}
