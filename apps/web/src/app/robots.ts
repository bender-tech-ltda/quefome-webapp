import type { MetadataRoute } from "next";
import { brand } from "@/lib/config";

/** Legacy controllers/robots.js: everything public except customer and admin areas. */
export default function robots(): MetadataRoute.Robots {
  const allow = process.env.ALLOW_ROBOTS === "true";
  return {
    rules: allow ? { userAgent: "*", disallow: ["/admin", "/usuario", "/*/pedido", "/*/pedidos"] } : { userAgent: "*", disallow: "/" },
    sitemap: `${brand.siteUrl}/sitemap.xml`,
    host: brand.siteUrl,
  };
}
