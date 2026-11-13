"use client";

import { AdminShell } from "@/features/admin/AdminShell";
import { MenuPage } from "@/features/admin/MenuPage";

export default function Page() {
  return <AdminShell>{() => <MenuPage />}</AdminShell>;
}
