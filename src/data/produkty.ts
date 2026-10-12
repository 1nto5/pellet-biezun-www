/**
 * The products' ids and names, and nothing else: `oferta.ts` builds the offer
 * on them, and the Pages Functions in `functions/api/` read them to check an
 * order and to name the product in the e-mails. The functions run outside
 * Astro and cannot load `oferta.ts`, which imports the photos, so this file
 * must stay plain data: no imports.
 *
 * The id is sent with the order form; keep it stable once orders come in.
 *
 * The Wielbark pellet's name states its origin with "IKEA": the client's wish,
 * decided by the owner on 2026-10-12. The IKEA logo is still never used.
 */
export const nazwyProduktow = {
  hiton: "Pellet HITON",
  wielbark: "Wood Pellets z IKEA Wielbark",
} as const;

export type ProduktId = keyof typeof nazwyProduktow;
