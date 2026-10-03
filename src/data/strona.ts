/**
 * Switches for the whole site.
 */

/**
 * Some of the company's details (registered name, NIP, hours, e-mail) are
 * still made up. While this is true every page shows a strip saying so and
 * carries `noindex`, so search engines do not keep the made-up data. Set to false once every value marked PRZYKŁAD is replaced
 * (`grep -rn PRZYKŁAD src astro.config.mjs` lists them).
 */
export const daneprzykladowe = true;

/**
 * The order and contact forms post to Pages Functions in `functions/api/`,
 * which come in stage 3. Until then a submit stays on the page and says the
 * form does not send yet.
 */
export const formularzeWlaczone = false;
