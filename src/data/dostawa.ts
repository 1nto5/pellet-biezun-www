/**
 * Free delivery distance in km, by road from the warehouse, as a satnav
 * counts it (`drogi.json`), never in a straight line. On its own,
 * with no imports, so the drive's script in the browser can use it without
 * taking the company data along; everything else gets it from `miejsca.ts`.
 */
export const DARMOWA_DOSTAWA_KM = 80;

/**
 * The free delivery rule in the owner's one sentence, and the one that
 * follows it, for every place the rule is explained (FAQ, offer, map, town
 * pages, llms.txt). Plain spaces: the middleware adds the non-breaking ones
 * to the page text, and llms.txt and the JSON-LD need none. The second
 * sentence has no full stop, so a place may end it with the phone number.
 */
export const ZASADA_DOSTAWY = `Dostawa gratis do ${DARMOWA_DOSTAWA_KM} km od magazynu, licząc po drogach.`;
export const DOSTAWA_DALEJ = "Dalej warunki ustalamy indywidualnie przez telefon";
