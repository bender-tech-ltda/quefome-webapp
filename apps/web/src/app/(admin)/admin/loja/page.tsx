"use client";

import { AdminShell } from "@/features/admin/AdminShell";
import { SettingsPage } from "@/features/admin/SettingsPage";

export default function Page() {
  return <AdminShell>{() => <SettingsPage />}</AdminShell>;
}
