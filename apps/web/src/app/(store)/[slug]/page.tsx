import type { Metadata } from "next";
import { StorePage } from "@/features/store/StorePage";
import { brand, pageTitle } from "@/lib/config";
import { loadMenu, loadStore } from "./data";

export const dynamic = "force-dynamic"; // store status/fees change during the day

type Props = { params: Promise<{ slug: string }> };

/** Server-rendered OG/Twitter tags: link previews in WhatsApp/Instagram (replaces the prerender service). */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const store = await loadStore((await params).slug);
  const title = pageTitle(store.name);
  const images = store.imageUrl ? [{ url: store.imageUrl }] : undefined;
  return {
    title,
    description: store.description,
    alternates: { canonical: `/${store.slug}` },
    openGraph: { title, description: store.description, url: `/${store.slug}`, type: "website", siteName: brand.name, locale: "pt_BR", images },
    twitter: { card: "summary", title, description: store.description, images: store.imageUrl ? [store.imageUrl] : undefined },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const [store, menu] = await Promise.all([loadStore(slug), loadMenu(slug)]);
  return <StorePage initialStore={store} menu={menu} />;
}
