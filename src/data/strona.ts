/**
 * Switches for the whole site.
 *
 * Everything that must change before the site goes live on its own domain is
 * marked `TODO(produkcja)` in the code, never on the page;
 * `grep -rn "TODO(produkcja)" src astro.config.mjs` lists it.
 */

/**
 * While true every page carries `noindex`. Off since 2026-10-12: the site is
 * open to search engines, with the details still marked TODO(produkcja) in
 * firma.ts as they are.
 */
export const przedStartem = false;

/**
 * The order and contact forms post to Pages Functions in `functions/api/`,
 * which come in stage 3. Until then a submit stays on the page and points
 * the reader to the phone.
 */
// TODO(produkcja): true once functions/api/ is deployed (stage 3).
export const formularzeWlaczone = false;
