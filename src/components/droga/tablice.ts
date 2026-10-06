/**
 * What stands by the road in the drive (`trasa.ts`): the direction boards,
 * and the still frames, which show the boards. Built from the towns in
 * `miejsca.ts`, at build time only.
 *
 * The boards give the towns' names only, nearest first: the site shows no
 * distances. They stand evenly along the first part of the road, high on
 * their posts so the truck never covers them, and the last one is gone
 * before the customer's house comes into view.
 */
import { podstrony, odlegloscKm, wStrefieDarmowej } from "../../data/miejsca";
import type { MiejsceZPodstrona } from "../../data/miejsca";
import { KM_DOJAZD, CZAS, stanAt, czasKm } from "./trasa";

/** Towns on one direction board. */
const NA_TABLICY = 3;
/** Road between two boards, in km; a board is about 4.25 km of road wide. */
const MIN_ODSTEP_KM = 5;

export interface Tablica {
  /** The odometer reading at which the board stands. */
  naDrodze: number;
  miasta: { nazwa: string; km: number }[];
}

/**
 * The boards along the road: the local-page towns inside the free zone,
 * nearest first, three to a board, spread evenly from km 16 to 34 km before
 * the house (the house comes into view about 20 km before the truck stops).
 * The road ahead lies left of the truck, under the hero's text on the first
 * screen; starting at km 16 keeps the first board out of it on most
 * windows, and on short ones the boards stay hidden until the truck moves
 * (droga.css).
 */
export const miastaWStrefie = podstrony
  .filter(wStrefieDarmowej)
  .map((m: MiejsceZPodstrona) => ({ nazwa: m.nazwa, km: odlegloscKm(m) }))
  .sort((a, b) => a.km - b.km);

export const tablice: Tablica[] = (() => {
  const rzedy: Tablica["miasta"][] = [];
  for (let i = 0; i < miastaWStrefie.length; i += NA_TABLICY) rzedy.push(miastaWStrefie.slice(i, i + NA_TABLICY));
  const od = 16;
  const doKm = KM_DOJAZD - 34;
  const krok = rzedy.length > 1 ? (doKm - od) / (rzedy.length - 1) : 0;
  // A smaller free zone or more towns would stand the boards on top of each
  // other: better a failed build than a broken scene.
  if (rzedy.length > 1 && krok < MIN_ODSTEP_KM) {
    throw new Error(`${rzedy.length} direction boards do not fit between km ${od} and ${doKm}; show fewer towns (tablice.ts).`);
  }
  return rzedy.map((miasta, i) => ({ naDrodze: Math.round(od + i * krok), miasta }));
})();

/** The frames shown when the drive does not move (reduced motion, no script). */
export const kadry = {
  zaladunek: stanAt(0),
  tablice: stanAt(czasKm((tablice[1] ?? tablice[0])!.naDrodze - 4)),
  naMiejscu: stanAt(CZAS.postoj),
  // The drive's end: the truck gone, the house and the sign.
  koniec: stanAt(100),
};
