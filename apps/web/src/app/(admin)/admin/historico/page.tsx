"use client";

import { AdminShell } from "@/features/admin/AdminShell";
import { HistoryPage } from "@/features/admin/HistoryPage";

export default function Page() {
  return <AdminShell>{(user) => <HistoryPage user={user} />}</AdminShell>;
}
