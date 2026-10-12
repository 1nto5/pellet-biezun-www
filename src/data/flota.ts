/**
 * The fleet, each truck with a tail lift and an electric pallet truck: the
 * offer page, the drive on the home page and llms.txt read this list.
 * `min`–`max` is how many pallets it takes; the row of blocks draws it, the
 * details say it. The label is the make and model, set as the main text,
 * with the details in a smaller line under it (`szczegolyLabel`). The two
 * Iveco Daily are the same, so one entry stands for both and its photo is
 * drawn twice, side by side (`sztuk`).
 *
 * The photos are the client's side views, cut out and levelled. `m` is the
 * vehicle's approximate length, so the trucks are drawn to one scale.
 */
import type { ImageMetadata } from "astro";
import fotoIveco from "../assets/flota/iveco.png";
import fotoVolvoFm from "../assets/flota/volvo-fm.png";
import fotoVolvoFh from "../assets/flota/volvo-fh.png";

export interface Auto {
  /** Make and model: the label's main text. */
  model: string;
  /** Short parts of the smaller line: count, weight, lift, pallets. */
  szczegoly: string[];
  min: number;
  max: number;
  /** Approximate length of one vehicle in metres. */
  m: number;
  /** How many identical vehicles the entry stands for; the photo is drawn that many times. One when left out. */
  sztuk?: number;
  zdjecie: ImageMetadata;
  alt: string;
}

export const flota: Auto[] = [
  {
    model: "Volvo FM",
    szczegoly: ["26 t", "winda", "12–14 palet"],
    min: 12,
    max: 14,
    m: 10,
    zdjecie: fotoVolvoFm,
    alt: "Czerwone Volvo FM z białą zabudową PELLET, z boku",
  },
  {
    model: "Volvo FH",
    szczegoly: ["winda", "14–16 palet"],
    min: 14,
    max: 16,
    m: 10,
    zdjecie: fotoVolvoFh,
    alt: "Czerwone Volvo FH z białą zabudową PELLET, z boku",
  },
  {
    model: "Iveco Daily",
    szczegoly: ["2 auta", "7,2 t", "winda", "do 4 palet, także na dojazd w trudno dostępne miejsca"],
    min: 4,
    max: 4,
    m: 7,
    sztuk: 2,
    zdjecie: fotoIveco,
    alt: "Iveco Daily z czarną zabudową PELLET, z boku",
  },
];

/** The length an entry's photos take on its strip: 7 m twice for the two Iveco. */
export function dlugoscNaPasie(a: Auto): number {
  return a.m * (a.sztuk ?? 1);
}

/** The longest strip's length: drawn full width, the others in proportion. */
export const najdluzszy = Math.max(...flota.map(dlugoscNaPasie));

/** "26 t · winda · 12–14 palet": the label's smaller line. */
export function szczegolyLabel(a: Auto): string {
  return a.szczegoly.join(" · ");
}
