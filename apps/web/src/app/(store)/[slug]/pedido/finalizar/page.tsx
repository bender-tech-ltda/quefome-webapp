import type { Metadata } from "next";
import { CheckoutPage } from "@/features/checkout/CheckoutPage";
import { pageTitle } from "@/lib/config";
import { loadStore } from "../../data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: pageTitle("Finalize seu pedido"), robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const store = await loadStore((await params).slug);
  return <CheckoutPage slug={store.slug} />;
}
