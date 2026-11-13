import type { Metadata } from "next";
import { SignupPage } from "@/features/admin/SignupPage";
import { brand } from "@/lib/config";

export const metadata: Metadata = { title: `Cadastre seu restaurante | ${brand.name}` };

export default function Page() {
  return <SignupPage />;
}
