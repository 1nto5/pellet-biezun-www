/**
 * Free delivery distance in km, by road from the warehouse, as a satnav
 * counts it (`drogi.json`), never in a straight line. On its own,
 * with no imports, so the drive's script in the browser can use it without
 * taking the company data along; everything else gets it from `miejsca.ts`.
 */
export const DARMOWA_DOSTAWA_KM = 80;
