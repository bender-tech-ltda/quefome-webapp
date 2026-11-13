import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import { StoreNavbar } from "@/components/StoreNavbar";
import { brand } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(brand.siteUrl),
  title: brand.defaultTitle,
  description: brand.defaultDescription,
  icons: { icon: "/assets/img/quefome_icon_70x75.png" },
  openGraph: { siteName: brand.name, type: "website", locale: "pt_BR" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#EF6815" };

/** Storefront root layout (legacy views/index.html). Legacy CSS is served as-is from /public. */
export default function StoreRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="stylesheet" href="/vendor/bootstrap-3.3.1.min.css" />
        <link rel="stylesheet" href="/assets/css/quefome-shell.css" />
        <link rel="stylesheet" href="/assets/css/quefome.css" />
        <link rel="stylesheet" href="/assets/css/quefome-icons.css" />
        <link rel="stylesheet" href="/assets/css/quefome-modern.css" />
        <link rel="stylesheet" href="/assets/css/quefome-app.css" />
      </head>
      <body>
        <Providers>
            <div className="page-body">
              <StoreNavbar />
              <main className="content">{children}</main>
              <footer className="footer">
                {brand.merchantLandingUrl && (
                  <a className="new-delivery" href={brand.merchantLandingUrl} target="_blank" rel="noreferrer" title="Clique aqui para saber como ter seu restaurante aqui">
                    <span className="qf-icon icon-home" aria-hidden="true" />
                    <span className="sr-only">Cadastre seu restaurante</span>
                  </a>
                )}
                {(brand.facebookUrl || brand.twitterUrl) && (
                  <div className="social-networks">
                    {brand.facebookUrl && (
                      <a className="facebook-link" href={brand.facebookUrl} target="_blank" rel="noreferrer" title="Siga nossa página no Facebook">
                        <span className="qf-icon icon-facebook-round" aria-hidden="true" />
                      </a>
                    )}
                    {brand.twitterUrl && (
                      <a className="twitter-link" href={brand.twitterUrl} target="_blank" rel="noreferrer" title="Siga nossa página no Twitter">
                        <span className="qf-icon icon-twitter" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                )}
                <p className="powered-by">Pedidos online por {brand.name}</p>
              </footer>
            </div>
        </Providers>
      </body>
    </html>
  );
}
