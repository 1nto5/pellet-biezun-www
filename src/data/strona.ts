/**
 * Switches for the whole site.
 *
 * Everything that must change before the site goes live on its own domain is
 * marked `TODO(produkcja)` in the code, never on the page;
 * `grep -rn "TODO(produkcja)" src astro.config.mjs` lists it.
 */

/**
 * While true every page carries `noindex`: some of the company's details are
 * not confirmed yet (firma.ts), and search engines must not keep them.
 */
// TODO(produkcja): false once every TODO(produkcja) in firma.ts is done.
export const przedStartem = true;

/**
 * The order and contact forms post to Pages Functions in `functions/api/`,
 * which come in stage 3. Until then a submit stays on the page and points
 * the reader to the phone.
 */
// TODO(produkcja): true once functions/api/ is deployed (stage 3).
export const formularzeWlaczone = false;
