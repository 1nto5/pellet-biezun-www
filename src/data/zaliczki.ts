/**
 * The warning against advance payments. Someone on Facebook Marketplace poses
 * as the company and takes deposits for cheap pellet that never comes (the
 * client's message of 2026-10-24: three people reported it, the police have
 * the case). The client asked for the sentence on the site; the header bar,
 * the order page, its confirmation e-mail, the FAQ and llms.txt read it from
 * here. It has no imports, so `functions/` can read it too.
 *
 * Only the client's own words. Whether the company sells on Facebook at all
 * and when the buyer pays are not confirmed, so the pages say neither.
 */
export const BEZ_ZALICZEK = "Nigdy nie pobieramy zaliczek ani przedpłat przed dostawą.";

/** The red bar at the top of every page (Header.astro); false hides it once the fraud dies down. */
export const pasekBezZaliczek = true;
