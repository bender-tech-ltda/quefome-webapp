import Link from "next/link";

/** Storefront navbar: brand + entry point for restaurants (customers have no account). */
export function StoreNavbar() {
  return (
    <nav className="navbar navbar-default navbar-quefome navbar-static-top">
      <div className="container">
        <div className="navbar-header">
          <Link className="navbar-brand navbar-quefome-brand" href="/" aria-label="Página inicial" />
          <Link className="navbar-merchant-link" href="/admin">
            Para restaurantes
          </Link>
        </div>
      </div>
    </nav>
  );
}
