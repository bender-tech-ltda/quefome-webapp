import { RESERVED_SLUGS } from "@quefome/contract";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ApiRequestError, api } from "@/lib/api";

/** Server-side store loading shared by generateMetadata and the pages (deduplicated per request). */
export const loadStore = cache(async (slug: string) => {
  if ((RESERVED_SLUGS as readonly string[]).includes(slug)) notFound();
  try {
    return await api.getStore(slug);
  } catch (error) {
    if (error instanceof ApiRequestError && error.isNotFound) notFound();
    throw error;
  }
});

export const loadMenu = cache((slug: string) => api.getMenu(slug));
