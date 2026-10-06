/**
 * Addresses inside the site. The site may be built under a sub-path (`SITE`
 * in astro.config.mjs), so an internal link is
 * never written as a bare "/oferta/": it goes through `href()`, which puts
 * Astro's `base` in front. At the domain root `base` is empty and nothing
 * changes.
 */
const base = import.meta.env.BASE_URL.replace(/\/$/, "");

/** "/oferta/" → "/oferta/" at the root, "/pellet-biezun-www/oferta/" under a sub-path. */
export function href(path: `/${string}`): string {
  return `${base}${path}`;
}

/** The full address, for canonical links, JSON-LD, the sitemap line and llms.txt. */
export function absoluteUrl(path: `/${string}`): string {
  return new URL(href(path), import.meta.env.SITE).toString();
}
