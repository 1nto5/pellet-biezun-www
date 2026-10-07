/**
 * Free delivery distance in km, by road from the warehouse (`drogi.json`).
 * The site no longer states it: the drive uses it to place the customer's
 * house inside the zone and to pick the towns on its boards. On its own,
 * with no imports, so the drive's script in the browser can use it without
 * taking the company data along; everything else gets it from `miejsca.ts`.
 */
export const DARMOWA_DOSTAWA_KM = 80;

/**
 * The free delivery in the owner's words, as on the home page, with no
 * distance: every place that speaks of the delivery's cost (FAQ, offer, map,
 * town pages, llms.txt) says just this.
 */
export const ZASADA_DOSTAWY = "Dostawa gratis.";
