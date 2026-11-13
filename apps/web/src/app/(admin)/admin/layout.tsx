import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import { brand } from "@/lib/config";

export const metadata: Metadata = {
  title: `${brand.name} Admin`,
  robots: { index: false, follow: false },
  icons: { icon: "/assets/img/quefome_icon_70x75.png" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#EB3825" };


/** Merchant panel root layout (legacy views/admin/index.html). Separate root layout = separate CSS. */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="stylesheet" href="/vendor/bootstrap-3.3.1.min.css" />
        <link rel="stylesheet" href="/assets/css/quefome-admin-shell.css" />
        <link rel="stylesheet" href="/assets/css/quefome-admin.css" />
        <link rel="stylesheet" href="/assets/css/quefome-icons.css" />
        <link rel="stylesheet" href="/assets/css/quefome-modern.css" />
        <link rel="stylesheet" href="/assets/css/quefome-app.css" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
