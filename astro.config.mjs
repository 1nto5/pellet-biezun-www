import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// PRZYKŁAD: the domain is not bought yet. Canonical links, the sitemap,
// robots.txt, llms.txt and the JSON-LD all build their addresses from this,
// so it is the only place to change once the client picks a domain.
const site = "https://pelletbiezun.pl";

export default defineConfig({
  site,
  // Cloudflare Pages serves /oferta/ from oferta/index.html and redirects
  // /oferta there, so every address ends with a slash.
  trailingSlash: "always",
  // Astro 7 defaults to "jsx", which drops the line break between text and a
  // tag the way React does: "09-320\n{city}" came out as "09-320Bieżuń".
  // `true` keeps HTML's own rule, that a line break is a space.
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap()],
});
