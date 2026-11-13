/**
 * Brand/config values that were hard-coded in the legacy app (29 "Quefo.me" strings, 12 "Canoas").
 * City/state now always come from store data; only the platform brand is configured here.
 */
export const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "Quefo.me",
  defaultTitle: process.env.NEXT_PUBLIC_BRAND_TITLE ?? "Quefo.me - Peça comida online direto do restaurante",
  defaultDescription:
    process.env.NEXT_PUBLIC_BRAND_DESCRIPTION ??
    "Peça comida online direto do seu restaurante favorito e receba em casa.",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Legacy footer links (optional). */
  merchantLandingUrl: process.env.NEXT_PUBLIC_MERCHANT_LANDING_URL ?? "",
  facebookUrl: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "",
  twitterUrl: process.env.NEXT_PUBLIC_TWITTER_URL ?? "",
};

/** The store page refreshes open/closed status and fees while the menu is open. */
export const POLLING = {
  storeParametersMs: 5 * 60_000,
};

export function pageTitle(part?: string): string {
  return part ? `${part} - ${brand.name}` : brand.defaultTitle;
}

/** Legacy qf-random-class on the home banner: varies per request (server side). */
export function pickHomeBanner(): "banner-burger" | "banner-pizza" {
  return Math.random() < 0.5 ? "banner-burger" : "banner-pizza";
}
