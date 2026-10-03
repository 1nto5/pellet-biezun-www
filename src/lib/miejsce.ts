/**
 * Small helpers around the places in `data/miejsca.ts`, shared by the map,
 * the pages and llms.txt.
 */
import type { Miejsce, MiejsceZPodstrona } from "../data/miejsca";

/** True when the place has its own page under /dostawa/. */
export const maPodstrone = (m: Miejsce): m is MiejsceZPodstrona => m.podstrona !== undefined;

/**
 * The note after a name. "czasem" and "rzadziej" say how often we go there, so
 * they are shown in parentheses, small and muted (`drobny`); anything else
 * ("k. Płońska") is part of the name and reads as such.
 */
export function dopisek(m: Miejsce): { tekst: string; drobny: boolean } | undefined {
  if (!m.dopisek) return undefined;
  const bare = m.dopisek.replace(/^\((.*)\)$/, "$1");
  if (bare === "czasem" || bare === "rzadziej") return { tekst: `(${bare})`, drobny: true };
  return { tekst: m.dopisek, drobny: false };
}

/** "Nowe Miasto k. Płońska", "Mikołajki (czasem)": for plain text. */
export function pelnaNazwa(m: Miejsce): string {
  const d = dopisek(m);
  return d ? `${m.nazwa} ${d.tekst}` : m.nazwa;
}
