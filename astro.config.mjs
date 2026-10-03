import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Canonical links, the sitemap, robots.txt, llms.txt and the JSON-LD all
// build their addresses from this, so it is the only place to change once
// the client picks a domain.
// TODO(produkcja): the domain is not bought yet; put the real one here.
const productionSite = "https://pelletbiezun.pl/";

// A preview copy hosted elsewhere is built with its own full address, path
// included, e.g. the GitHub Pages workflow runs
// `SITE=https://1nto5.github.io/pellet-biezun-www/ bun run build`.
// Such a build is a preview and carries `noindex` (src/lib/env.ts).
const site = new URL(process.env.SITE ?? productionSite);
// The base must end with a slash, whether or not SITE did.
site.pathname = site.pathname.replace(/\/?$/, "/");

export default defineConfig({
  site: site.origin,
  base: site.pathname,
  // Static hosts serve /oferta/ from oferta/index.html and redirect /oferta
  // there, so every address ends with a slash.
  trailingSlash: "always",
  // The local pages live under /dostawa/<town>/; the folder itself has no
  // page. A static redirect page works on every host. Astro puts the base in
  // front of the source but not of the destination.
  redirects: {
    "/dostawa/": `${site.pathname}mapa-dystrybucji/`,
  },
  // Astro 7 defaults to "jsx", which drops the line break between text and a
  // tag the way React does: "09-320\n{city}" came out as "09-320Bieżuń".
  // `true` keeps HTML's own rule, that a line break is a space.
  compressHTML: true,
  // The whole stylesheet goes into each page, about 13 kB compressed: the
  // first paint then waits for no request after the HTML. Pages are few and
  // short, so the lost caching between them costs less than the wait.
  build: {
    inlineStylesheets: "always",
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap()],
});
