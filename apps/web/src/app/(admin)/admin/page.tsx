"use client";

import { AdminShell } from "@/features/admin/AdminShell";
import { Board } from "@/features/admin/Board";

export default function Page() {
  return <AdminShell>{(user) => <Board user={user} />}</AdminShell>;
}
