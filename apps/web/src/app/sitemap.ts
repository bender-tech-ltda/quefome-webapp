import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import { brand } from "@/lib/config";

/** Legacy controllers/sitemap.js: home, search, one page per cuisine type and per store. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [types, stores] = await Promise.all([api.listCuisineTypes().catch(() => []), api.searchStores({}).catch(() => [])]);
  const url = (path: string) => `${brand.siteUrl}${path}`;
  return [
    { url: url("/"), changeFrequency: "daily", priority: 0.5 },
    { url: url("/restaurantes"), changeFrequency: "daily", priority: 0.5 },
    ...types.map((t) => ({ url: url(`/restaurantes/${t.slug}`), changeFrequency: "weekly" as const, priority: 0.4 })),
    ...stores.map((s) => ({ url: url(`/${s.slug}`), changeFrequency: "daily" as const, priority: 0.8 })),
  ];
}
