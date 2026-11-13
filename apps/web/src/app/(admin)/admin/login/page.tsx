import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoginPage } from "@/features/admin/AdminLoginPage";
import { brand } from "@/lib/config";

export const metadata: Metadata = { title: `Acesso restrito | ${brand.name} Admin` };

export default function Page() {
  return (
    <Suspense>
      <AdminLoginPage />
    </Suspense>
  );
}
