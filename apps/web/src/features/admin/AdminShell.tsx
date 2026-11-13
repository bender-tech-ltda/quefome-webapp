"use client";

import type { StaffUser } from "@quefome/contract";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, createContext, useContext, useEffect, useState } from "react";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { brand } from "@/lib/config";
import { useStaffAuthActions, useStaffSession } from "./useStaffSession";

const TitlePrefixContext = createContext<(prefix: string) => void>(() => undefined);
export const useAdminTitlePrefix = () => useContext(TitlePrefixContext);

const MENU = [
  { href: "/admin", label: "Pedidos" },
  { href: "/admin/cardapio", label: "Cardápio" },
  { href: "/admin/loja", label: "Loja" },
  { href: "/admin/historico", label: "Histórico" },
];

/** Merchant area chrome + login guard. Mobile first: a compact top bar and a tab-like menu. */
export function AdminShell({ children }: { children: (user: StaffUser) => ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isChecked } = useStaffSession();
  const { logout } = useStaffAuthActions();
  const [prefix, setPrefix] = useState("");

  useEffect(() => {
    if (isChecked && !user) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [isChecked, user, router, pathname]);

  useEffect(() => {
    document.title = prefix + document.title.replace(/^\(\d+\) /, "");
  }, [prefix, pathname]);

  if (!isChecked || !user) return <LoadingAnimation />;

  return (
    <TitlePrefixContext.Provider value={setPrefix}>
      <div className="qf-admin">
        <header className="qf-admin-top">
          <span className="qf-admin-store">{user.store.name}</span>
          <span className="qf-admin-links">
            {user.store.published && (
              <a href={`/${user.store.slug}`} target="_blank" rel="noreferrer">
                Ver loja
              </a>
            )}
            <button type="button" className="btn btn-link" onClick={() => logout.mutate(undefined, { onSuccess: () => router.replace("/admin/login") })}>
              Sair
            </button>
          </span>
        </header>
        <nav className="qf-admin-nav" aria-label="Menu principal">
          {MENU.map((item) => (
            <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""} aria-current={pathname === item.href ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        {!user.store.published && pathname !== "/admin/loja" && (
          <p className="qf-banner" role="status">
            Sua loja ainda não está publicada. <Link href="/admin/loja">Complete a configuração e publique</Link>.
          </p>
        )}
        <main className="qf-admin-main">{children(user)}</main>
        <footer className="qf-admin-footer">{brand.name}</footer>
      </div>
    </TitlePrefixContext.Provider>
  );
}
