import type { Metadata } from "next";
import { HomePage } from "@/features/marketplace/HomePage";
import { api } from "@/lib/api";
import { brand, pickHomeBanner } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: brand.defaultTitle, description: brand.defaultDescription, alternates: { canonical: "/" } };

/** Marketplace home (kept as a secondary channel): cuisine types + search by name. */
export default async function Page() {
  const cuisineTypes = await api.listCuisineTypes();
  const banner = pickHomeBanner();
  return <HomePage cuisineTypes={cuisineTypes} banner={banner} />;
}
