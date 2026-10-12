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
 * The order and contact forms post to the Pages Functions in `functions/api/`,
 * which send them by e-mail. While false, a submit stays on the page and
 * points the reader to the phone.
 */
// TODO(produkcja): true only on the `forms` branch for now. It must not reach
// `main` before a test order and a test message sent from the branch's preview
// arrive by e-mail.
export const formularzeWlaczone = true;

/**
 * The public half of the Turnstile widget's key pair; the secret half is
 * TURNSTILE_SECRET in Cloudflare. This one is Cloudflare's test key, whose
 * visible widget always passes
 * (https://developers.cloudflare.com/turnstile/troubleshooting/testing/). Its
 * token passes only with a test secret, which the functions take only on
 * localhost.
 */
// TODO(produkcja): the real widget's site key
export const turnstileSiteKey = "1x00000000000000000000AA";
