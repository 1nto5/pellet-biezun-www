/**
 * Cloudflare Pages sets CF_PAGES_BRANCH during its build. A build of any branch
 * other than main is a preview on its own *.pages.dev address, which search
 * engines must not index. A local build has no branch and counts as production.
 */
const branch = process.env.CF_PAGES_BRANCH;
export const isPreview = branch !== undefined && branch !== "main";
