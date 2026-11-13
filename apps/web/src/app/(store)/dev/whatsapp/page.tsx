import type { Metadata } from "next";
import { DevInbox } from "@/features/order/DevInbox";

export const metadata: Metadata = { title: "WhatsApp (simulado)", robots: { index: false, follow: false } };

export default function Page() {
  return <DevInbox />;
}
