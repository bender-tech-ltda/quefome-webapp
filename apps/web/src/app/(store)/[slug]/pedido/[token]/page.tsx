import type { Metadata } from "next";
import { OrderPage } from "@/features/order/OrderPage";
import { pageTitle } from "@/lib/config";
import { loadStore } from "../../data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: pageTitle("Seu pedido"), robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = await params;
  const store = await loadStore(slug);
  return <OrderPage token={token} timeZone={store.timeZone} />;
}
