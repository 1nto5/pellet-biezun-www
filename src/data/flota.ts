/**
 * The fleet, each truck with a tail lift and an electric pallet truck: the
 * offer page and the drive on the home page read this list.
 * `min`–`max` is how many pallets it takes; the row of blocks draws it, the
 * details say it. The label is the make and model, set as the main text,
 * with the details in a smaller line under it (`szczegolyLabel`). The two
 * Iveco Daily are the same, so one photo shows both.
 *
 * The photos are the client's side views, cut out and levelled. `m` is the
 * vehicle's approximate length, so the trucks are drawn to one scale.
 */
import type { ImageMetadata } from "astro";
import fotoIveco from "../assets/flota/iveco.png";
import fotoVolvoFm from "../assets/flota/volvo-fm.png";
import fotoVolvoFh from "../assets/flota/volvo-fh.png";
import fotoVolvoFhNaczepa from "../assets/flota/volvo-fh-naczepa.png";

export interface Auto {
  /** Make and model: the label's main text. */
  model: string;
  /** Short parts of the smaller line: count, weight, lift, pallets. */
  szczegoly: string[];
  min: number;
  max: number;
  /** Approximate length in metres. */
  m: number;
  zdjecie: ImageMetadata;
  alt: string;
}

export const flota: Auto[] = [
  {
    model: "Iveco Daily",
    szczegoly: ["2 auta", "7,2 t", "winda", "do 4 palet, także na ciasne dojazdy"],
    min: 4,
    max: 4,
    m: 7,
    zdjecie: fotoIveco,
    alt: "Iveco Daily z czarną zabudową PELLET, z boku",
  },
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
    model: "Volvo FH16",
    szczegoly: ["naczepa kurtynowa", "26 palet"],
    min: 26,
    max: 26,
    m: 16.5,
    zdjecie: fotoVolvoFhNaczepa,
    alt: "Czerwony ciągnik Volvo FH16 z czarną naczepą kurtynową, z boku",
  },
];

/** The longest vehicle's length: drawn full width, the others in proportion. */
export const najdluzszy = Math.max(...flota.map((f) => f.m));

/** "26 t · winda · 12–14 palet": the label's smaller line. */
export function szczegolyLabel(a: Auto): string {
  return a.szczegoly.join(" · ");
}
