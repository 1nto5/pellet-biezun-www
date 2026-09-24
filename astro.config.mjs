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
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap()],
});
