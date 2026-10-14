/**
 * The label a place from the index gets in the town search on the
 * distribution map: "Szymany (gm. Szczytno)". The powiat is added where the
 * short label could be taken for another place:
 * - two places of the index would read the same, or
 * - the place bears the name of a town on our list and its gmina does too,
 *   so "Górzno (gm. Górzno)" near Garwolin would pass for the listed Górzno
 *   near Brodnica, the seat of a gmina of that name.
 */
import { zloz } from "./zloz";

export interface WpisIndeksu {
  nazwa: string;
  gmina: string;
  powiat: string;
}

/**
 * One label per place, in the order given. `nazwyZListy` are the names of
 * the towns on the list, folded (`zloz`).
 */
export function etykietyZIndeksu(wpisy: readonly WpisIndeksu[], nazwyZListy: ReadonlySet<string>): string[] {
  const krotka = (w: WpisIndeksu) => `${w.nazwa} (gm.\u00a0${w.gmina})`;
  const ile = new Map<string, number>();
  for (const w of wpisy) ile.set(krotka(w), (ile.get(krotka(w)) ?? 0) + 1);
  return wpisy.map((w) => {
    const jakZListy = nazwyZListy.has(zloz(w.nazwa)) && zloz(w.gmina) === zloz(w.nazwa);
    return ile.get(krotka(w))! > 1 || jakZListy ? `${w.nazwa} (gm.\u00a0${w.gmina}, pow.\u00a0${w.powiat})` : krotka(w);
  });
}
