/**
 * The drive's own distance in km, by road from the warehouse (`drogi.json`):
 * the drive uses it to place the customer's house and to pick the towns on
 * its boards. It is not the stated rule: the site says 200 km
 * (`ZASADA_DOSTAWY`). On its own, with no imports, so the drive's script in
 * the browser can use it without taking the company data along; everything
 * else gets it from `miejsca.ts`.
 */
export const DARMOWA_DOSTAWA_KM = 80;

/**
 * The free delivery in the owner's words: every place that speaks of the
 * delivery's cost (FAQ, offer, map, town pages, llms.txt, the page about the
 * company) says just this. The slogans ("Dostawa gratis" on the home page
 * and in the descriptions) stay short, with no distance.
 */
export const ZASADA_DOSTAWY = "Dostawa gratis w promieniu 200 km lub indywidualnie do ustalenia.";
