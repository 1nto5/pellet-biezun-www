/**
 * The fleet, each truck with a tail lift and an electric pallet truck: the
 * offer page, the drive on the home page and llms.txt read this list.
 * `min`–`max` is how many pallets it takes; the row of blocks draws it, the
 * details say it. The label is the make and model, set as the main text,
 * with the details in a smaller line under it (`szczegolyLabel`). No weights:
 * the client wants only the lift and the pallets named (2026-10-13). The two
 * Iveco Daily are two entries, each with its own label and the same photo;
 * they stand side by side in one row (`wParze`).
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
  /** Short parts of the smaller line: lift, pallets. */
  szczegoly: string[];
  min: number;
  max: number;
  /** Approximate length of the vehicle in metres. */
  m: number;
  /** Shares its row with the entry beside it, each on half of the row. A longer vehicle has a row to itself. */
  wParze?: true;
  zdjecie: ImageMetadata;
  alt: string;
}

/** One Iveco Daily; the company has two of them, alike. */
const iveco: Auto = {
  model: "Iveco Daily",
  szczegoly: ["winda", "do 4 palet, także na dojazd w trudno dostępne miejsca"],
  min: 4,
  max: 4,
  m: 7,
  wParze: true,
  zdjecie: fotoIveco,
  alt: "Iveco Daily z czarną zabudową PELLET, z boku",
};

export const flota: Auto[] = [
  {
    model: "Volvo FM",
    szczegoly: ["winda", "12–14 palet"],
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
  iveco,
  iveco,
];

/** A row's length in metres: the longest vehicle, or two that stand in a pair (7 m twice for the Iveco). */
const dlugoscRzedu = Math.max(...flota.map((a) => a.m * (a.wParze ? 2 : 1)));

/** The vehicle's share of a row's length, so all are drawn to one scale: 0.5 for an Iveco, 0.714 for a Volvo. */
export function udzial(a: Auto): number {
  return Math.round((a.m / dlugoscRzedu) * 1000) / 1000;
}

/** "winda · 12–14 palet": the label's smaller line. */
export function szczegolyLabel(a: Auto): string {
  return a.szczegoly.join(" · ");
}
