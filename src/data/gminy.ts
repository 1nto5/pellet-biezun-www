/**
 * The gminas of the place index (`src/data/indeks`, made by
 * `scripts/indeks-miejscowosci.mjs`), for the local pages under /dostawa/.
 * The index holds every village within the delivery range, so a gmina is in
 * it only when we deliver there; a county far from the warehouse may have
 * only some of its gminas in it.
 *
 * A gmina's place is the middle of its villages in the index, as in
 * `scripts/trasy-gmin.mjs`. It only sorts the gminas: the pages give road km,
 * and there are none for gminas.
 */
import type { Geo } from "../lib/geo";

interface Indeks {
  /** [gmina, powiat] */
  gminy: [string, string][];
  /** [name, index into `gminy`, lat, lng] */
  miejsca: [string, number, number, number][];
}

export interface Gmina {
  nazwa: string;
  powiat: string;
  geo: Geo;
}

const pliki = Object.values(import.meta.glob<Indeks>("./indeks/*.json", { eager: true, import: "default" }));

// One gmina can have villages in several files (one file per first letter),
// and two gminas can share a name, so the key is name and county together.
const zebrane = new Map<string, { nazwa: string; powiat: string; lat: number; lng: number; ile: number }>();
for (const plik of pliki) {
  for (const [, g, lat, lng] of plik.miejsca) {
    const wpis = plik.gminy[g];
    if (!wpis) throw new Error(`A village in src/data/indeks points to no gmina (${g}): run bun scripts/indeks-miejscowosci.mjs`);
    const [nazwa, powiat] = wpis;
    const klucz = `${nazwa}|${powiat}`;
    const gmina = zebrane.get(klucz) ?? { nazwa, powiat, lat: 0, lng: 0, ile: 0 };
    gmina.lat += lat;
    gmina.lng += lng;
    gmina.ile += 1;
    zebrane.set(klucz, gmina);
  }
}

export const gminy: Gmina[] = [...zebrane.values()].map(({ nazwa, powiat, lat, lng, ile }) => ({
  nazwa,
  powiat,
  geo: { lat: lat / ile, lng: lng / ile },
}));

/** The index's gminas in this county; a county missing from the index stops the build. */
export function gminyPowiatu(powiat: string): Gmina[] {
  const wPowiecie = gminy.filter((g) => g.powiat === powiat);
  if (wPowiecie.length === 0) throw new Error(`No gmina of powiat ${powiat} in src/data/indeks: check podstrona.powiat in miejsca.ts`);
  return wPowiecie;
}
