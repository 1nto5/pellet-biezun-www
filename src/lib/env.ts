/**
 * Whether this build is a preview, which search engines must not index.
 *
 * - Cloudflare Pages sets CF_PAGES_BRANCH during its build; any branch other
 *   than main is a preview on its own *.pages.dev address.
 * - A copy hosted elsewhere is built with its own address in SITE
 *   (astro.config.mjs).
 *
 * A local build has neither and counts as production.
 */
const branch = process.env.CF_PAGES_BRANCH;
export const isPreview = (branch !== undefined && branch !== "main") || process.env.SITE !== undefined;
