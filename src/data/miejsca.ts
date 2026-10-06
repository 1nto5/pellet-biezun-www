/**
 * Towns the company delivers pellet to: one list for the map on
 * /mapa-dystrybucji/, the 15 local pages under /dostawa/<slug>/, the delivery
 * area in the JSON-LD (areaServed) and llms.txt.
 *
 * Whether a town is in the free delivery zone is not stored: it follows from
 * its road distance from the warehouse, as a satnav counts it (`drogi.json`,
 * made by `scripts/odleglosci-drogowe.mjs`; run it again after adding a town).
 *
 * `podstrona.slug` is the part of the address after /dostawa/: lowercase, no
 * Polish letters, written by hand so a page keeps its address.
 *
 * The list is the client's own, sent 2026-09-30, with spelling corrected.
 * Coordinates from OpenStreetMap (Nominatim).
 */
import type { Geo } from "../lib/geo";
import { maPodstrone } from "../lib/miejsce";
import { href } from "../lib/url";
import drogi from "./drogi.json";
import { DARMOWA_DOSTAWA_KM, ZASADA_DOSTAWY, DOSTAWA_DALEJ } from "./dostawa";

export type Wojewodztwo = "mazowieckie" | "łódzkie" | "podlaskie" | "kujawsko-pomorskie" | "warmińsko-mazurskie";

/** Display order of the voivodeship groups. */
export const wojewodztwa: readonly Wojewodztwo[] = ["mazowieckie", "łódzkie", "podlaskie", "kujawsko-pomorskie", "warmińsko-mazurskie"];

export interface Podstrona {
  slug: string;
  /** "w Płocku" and "do Płocka": the forms the local page's sentences need. */
  wMiejscowosci: string;
  doMiejscowosci: string;
  /**
   * What only this town's page can say, from the client: delivery days, the
   * estates and villages around it, the car that usually goes there.
   */
  // TODO(produkcja): ask the client for a few sentences per town; without
  // them the 15 pages differ only in the town's name and its neighbours.
  opis?: string;
}

export interface Miejsce {
  nazwa: string;
  /** Shown after the name: "k. Płońska", "czasem", "rzadziej". */
  dopisek?: string;
  wojewodztwo: Wojewodztwo;
  geo: Geo;
  podstrona?: Podstrona;
}

export type MiejsceZPodstrona = Miejsce & { podstrona: Podstrona };

/** Free delivery distance in km, by road from the warehouse, and the rule's sentences (`dostawa.ts`). */
export { DARMOWA_DOSTAWA_KM, ZASADA_DOSTAWY, DOSTAWA_DALEJ };

export const miejsca: Miejsce[] = [
  { nazwa: "Bieżuń", wojewodztwo: "mazowieckie", geo: { lat: 52.9618, lng: 19.89 } },
  { nazwa: "Żuromin", wojewodztwo: "mazowieckie", geo: { lat: 53.0672, lng: 19.9078 }, podstrona: { slug: "zuromin", wMiejscowosci: "w Żurominie", doMiejscowosci: "do Żuromina" } },
  { nazwa: "Sierpc", wojewodztwo: "mazowieckie", geo: { lat: 52.8529, lng: 19.6675 }, podstrona: { slug: "sierpc", wMiejscowosci: "w Sierpcu", doMiejscowosci: "do Sierpca" } },
  { nazwa: "Raciąż", wojewodztwo: "mazowieckie", geo: { lat: 52.7811, lng: 20.1181 } },
  { nazwa: "Glinojeck", wojewodztwo: "mazowieckie", geo: { lat: 52.8192, lng: 20.2863 } },
  { nazwa: "Mława", wojewodztwo: "mazowieckie", geo: { lat: 53.1116, lng: 20.3832 }, podstrona: { slug: "mlawa", wMiejscowosci: "w Mławie", doMiejscowosci: "do Mławy" } },
  { nazwa: "Ciechanów", wojewodztwo: "mazowieckie", geo: { lat: 52.882, lng: 20.6191 }, podstrona: { slug: "ciechanow", wMiejscowosci: "w Ciechanowie", doMiejscowosci: "do Ciechanowa" } },
  { nazwa: "Płońsk", wojewodztwo: "mazowieckie", geo: { lat: 52.6227, lng: 20.3705 }, podstrona: { slug: "plonsk", wMiejscowosci: "w Płońsku", doMiejscowosci: "do Płońska" } },
  { nazwa: "Nowe Miasto", dopisek: "k. Płońska", wojewodztwo: "mazowieckie", geo: { lat: 52.6563, lng: 20.6307 } },
  { nazwa: "Drobin", wojewodztwo: "mazowieckie", geo: { lat: 52.7378, lng: 19.9893 } },
  { nazwa: "Bulkowo", wojewodztwo: "mazowieckie", geo: { lat: 52.5428, lng: 20.1162 } },
  { nazwa: "Staroźreby", wojewodztwo: "mazowieckie", geo: { lat: 52.6322, lng: 19.9876 } },
  { nazwa: "Bielsk", wojewodztwo: "mazowieckie", geo: { lat: 52.6713, lng: 19.8049 } },
  { nazwa: "Płock", wojewodztwo: "mazowieckie", geo: { lat: 52.5465, lng: 19.7009 }, podstrona: { slug: "plock", wMiejscowosci: "w Płocku", doMiejscowosci: "do Płocka" } },
  { nazwa: "Gostynin", wojewodztwo: "mazowieckie", geo: { lat: 52.4288, lng: 19.4613 } },
  { nazwa: "Gąbin", wojewodztwo: "mazowieckie", geo: { lat: 52.3994, lng: 19.7307 } },
  { nazwa: "Iłów", wojewodztwo: "mazowieckie", geo: { lat: 52.3395, lng: 20.0263 } },
  { nazwa: "Sanniki", wojewodztwo: "mazowieckie", geo: { lat: 52.3309, lng: 19.8669 } },
  { nazwa: "Wyszogród", wojewodztwo: "mazowieckie", geo: { lat: 52.3884, lng: 20.1913 } },
  { nazwa: "Sochaczew", wojewodztwo: "mazowieckie", geo: { lat: 52.2297, lng: 20.2379 } },
  { nazwa: "Cieksyn", wojewodztwo: "mazowieckie", geo: { lat: 52.5743, lng: 20.6678 } },
  { nazwa: "Nasielsk", wojewodztwo: "mazowieckie", geo: { lat: 52.5868, lng: 20.813 } },
  { nazwa: "Nowy Dwór Mazowiecki", wojewodztwo: "mazowieckie", geo: { lat: 52.4307, lng: 20.7155 } },
  { nazwa: "Serock", wojewodztwo: "mazowieckie", geo: { lat: 52.5135, lng: 21.0731 } },
  { nazwa: "Pułtusk", wojewodztwo: "mazowieckie", geo: { lat: 52.7051, lng: 21.084 } },
  { nazwa: "Karniewo", wojewodztwo: "mazowieckie", geo: { lat: 52.8359, lng: 20.9913 } },
  { nazwa: "Maków Mazowiecki", wojewodztwo: "mazowieckie", geo: { lat: 52.8657, lng: 21.1012 } },
  { nazwa: "Różan", wojewodztwo: "mazowieckie", geo: { lat: 52.8893, lng: 21.3993 } },
  { nazwa: "Długosiodło", wojewodztwo: "mazowieckie", geo: { lat: 52.7596, lng: 21.5929 } },
  { nazwa: "Zaręby Kościelne", wojewodztwo: "mazowieckie", geo: { lat: 52.7571, lng: 22.1248 } },
  { nazwa: "Brok", wojewodztwo: "mazowieckie", geo: { lat: 52.6989, lng: 21.8602 } },
  { nazwa: "Małkinia Górna", wojewodztwo: "mazowieckie", geo: { lat: 52.6932, lng: 22.0351 } },
  { nazwa: "Ostrów Mazowiecka", wojewodztwo: "mazowieckie", geo: { lat: 52.8, lng: 21.8976 } },
  { nazwa: "Ostrołęka", wojewodztwo: "mazowieckie", geo: { lat: 53.0843, lng: 21.5669 }, podstrona: { slug: "ostroleka", wMiejscowosci: "w Ostrołęce", doMiejscowosci: "do Ostrołęki" } },
  { nazwa: "Baranowo", wojewodztwo: "mazowieckie", geo: { lat: 53.1752, lng: 21.2952 } },
  { nazwa: "Kadzidło", wojewodztwo: "mazowieckie", geo: { lat: 53.2346, lng: 21.4643 } },
  { nazwa: "Krasnosielc", wojewodztwo: "mazowieckie", geo: { lat: 53.0336, lng: 21.1575 } },
  { nazwa: "Jednorożec", wojewodztwo: "mazowieckie", geo: { lat: 53.1405, lng: 21.0506 } },
  { nazwa: "Przasnysz", wojewodztwo: "mazowieckie", geo: { lat: 53.019, lng: 20.8804 }, podstrona: { slug: "przasnysz", wMiejscowosci: "w Przasnyszu", doMiejscowosci: "do Przasnysza" } },
  { nazwa: "Chorzele", wojewodztwo: "mazowieckie", geo: { lat: 53.261, lng: 20.8979 } },
  { nazwa: "Myszyniec", wojewodztwo: "mazowieckie", geo: { lat: 53.3832, lng: 21.3421 } },
  { nazwa: "Łowicz", wojewodztwo: "łódzkie", geo: { lat: 52.1077, lng: 19.9448 } },
  { nazwa: "Kiernozia", wojewodztwo: "łódzkie", geo: { lat: 52.2688, lng: 19.8711 } },
  { nazwa: "Żychlin", wojewodztwo: "łódzkie", geo: { lat: 52.244, lng: 19.6261 } },
  { nazwa: "Łomża", wojewodztwo: "podlaskie", geo: { lat: 53.1751, lng: 22.0728 } },
  { nazwa: "Włocławek", wojewodztwo: "kujawsko-pomorskie", geo: { lat: 52.6604, lng: 19.0719 }, podstrona: { slug: "wloclawek", wMiejscowosci: "we Włocławku", doMiejscowosci: "do Włocławka" } },
  { nazwa: "Dobrzyń nad Wisłą", wojewodztwo: "kujawsko-pomorskie", geo: { lat: 52.6375, lng: 19.3214 } },
  { nazwa: "Tłuchowo", wojewodztwo: "kujawsko-pomorskie", geo: { lat: 52.7468, lng: 19.4673 } },
  { nazwa: "Wielgie", wojewodztwo: "kujawsko-pomorskie", geo: { lat: 52.7404, lng: 19.2617 } },
  { nazwa: "Lipno", wojewodztwo: "kujawsko-pomorskie", geo: { lat: 52.8474, lng: 19.1793 } },
  { nazwa: "Skępe", wojewodztwo: "kujawsko-pomorskie", geo: { lat: 52.8672, lng: 19.3465 } },
  { nazwa: "Kikół", wojewodztwo: "kujawsko-pomorskie", geo: { lat: 52.9123, lng: 19.1203 } },
  { nazwa: "Czernikowo", wojewodztwo: "kujawsko-pomorskie", geo: { lat: 52.9423, lng: 18.9373 } },
  { nazwa: "Obrowo", wojewodztwo: "kujawsko-pomorskie", geo: { lat: 52.9712, lng: 18.8789 } },
  { nazwa: "Ciechocin", wojewodztwo: "kujawsko-pomorskie", geo: { lat: 53.0565, lng: 18.9244 } },
  { nazwa: "Kowalewo Pomorskie", wojewodztwo: "kujawsko-pomorskie", geo: { lat: 53.1543, lng: 18.8975 } },
  { nazwa: "Golub-Dobrzyń", wojewodztwo: "kujawsko-pomorskie", geo: { lat: 53.1139, lng: 19.0545 } },
  { nazwa: "Jabłonowo Pomorskie", wojewodztwo: "kujawsko-pomorskie", geo: { lat: 53.388, lng: 19.1527 } },
  { nazwa: "Wąbrzeźno", wojewodztwo: "kujawsko-pomorskie", geo: { lat: 53.28, lng: 18.9473 } },
  { nazwa: "Brodnica", wojewodztwo: "kujawsko-pomorskie", geo: { lat: 53.2581, lng: 19.3994 }, podstrona: { slug: "brodnica", wMiejscowosci: "w Brodnicy", doMiejscowosci: "do Brodnicy" } },
  { nazwa: "Rypin", wojewodztwo: "kujawsko-pomorskie", geo: { lat: 53.0673, lng: 19.406 }, podstrona: { slug: "rypin", wMiejscowosci: "w Rypinie", doMiejscowosci: "do Rypina" } },
  { nazwa: "Nowe Miasto Lubawskie", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.4256, lng: 19.5936 } },
  { nazwa: "Lubawa", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.5051, lng: 19.7494 } },
  { nazwa: "Iława", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.5976, lng: 19.5612 }, podstrona: { slug: "ilawa", wMiejscowosci: "w Iławie", doMiejscowosci: "do Iławy" } },
  { nazwa: "Grunwald", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.4853, lng: 20.0915 } },
  { nazwa: "Dąbrówno", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.433, lng: 20.0361 } },
  { nazwa: "Działdowo", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.2347, lng: 20.1818 }, podstrona: { slug: "dzialdowo", wMiejscowosci: "w Działdowie", doMiejscowosci: "do Działdowa" } },
  { nazwa: "Lidzbark", dopisek: "Welski", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.2628, lng: 19.8232 } },
  { nazwa: "Kozłowo", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.3072, lng: 20.2931 } },
  { nazwa: "Nidzica", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.3614, lng: 20.4276 } },
  { nazwa: "Olsztynek", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.5834, lng: 20.2816 } },
  { nazwa: "Jedwabno", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.5298, lng: 20.7268 } },
  { nazwa: "Pasym", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.6522, lng: 20.7917 } },
  { nazwa: "Dźwierzuty", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.7046, lng: 20.9609 } },
  { nazwa: "Szczytno", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.5655, lng: 20.9916 }, podstrona: { slug: "szczytno", wMiejscowosci: "w Szczytnie", doMiejscowosci: "do Szczytna" } },
  { nazwa: "Rozogi", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.4824, lng: 21.3597 } },
  { nazwa: "Wielbark", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.3984, lng: 20.9463 } },
  { nazwa: "Stare Kiełbonki", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.662, lng: 21.3446 } },
  { nazwa: "Biskupiec", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.8638, lng: 20.955 } },
  { nazwa: "Mrągowo", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.8661, lng: 21.3046 } },
  { nazwa: "Mikołajki", dopisek: "czasem", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.7982, lng: 21.5772 } },
  { nazwa: "Reszel", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 54.0483, lng: 21.1422 } },
  { nazwa: "Barczewo", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.8297, lng: 20.6911 } },
  { nazwa: "Jeziorany", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.9769, lng: 20.7459 } },
  { nazwa: "Lidzbark Warmiński", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 54.1259, lng: 20.5806 } },
  { nazwa: "Bartoszyce", dopisek: "rzadziej", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 54.2524, lng: 20.8144 } },
  { nazwa: "Dobre Miasto", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.9869, lng: 20.3973 } },
  { nazwa: "Dywity", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.834, lng: 20.4734 } },
  { nazwa: "Olsztyn", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.7767, lng: 20.4765 }, podstrona: { slug: "olsztyn", wMiejscowosci: "w Olsztynie", doMiejscowosci: "do Olsztyna" } },
  { nazwa: "Gietrzwałd", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.748, lng: 20.2344 } },
  { nazwa: "Łukta", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.8049, lng: 20.084 } },
  { nazwa: "Ostróda", wojewodztwo: "warmińsko-mazurskie", geo: { lat: 53.7029, lng: 19.9623 } },
];

export const podstrony: MiejsceZPodstrona[] = miejsca.filter(maPodstrone);
export const miejsceHref = (m: MiejsceZPodstrona) => href(`/dostawa/${m.podstrona.slug}/`);
/** Km by road from the warehouse; a town missing from `drogi.json` stops the build. */
export const odlegloscKm = (m: Miejsce): number => {
  const km = (drogi.km as Record<string, number>)[m.nazwa];
  if (km === undefined) throw new Error(`No road distance for ${m.nazwa}: run bun scripts/odleglosci-drogowe.mjs`);
  return km;
};
export const wStrefieDarmowej = (m: Miejsce) => odlegloscKm(m) <= DARMOWA_DOSTAWA_KM;

/**
 * The towns with their own page, nearest first. Not split into free and paid
 * delivery: the pages state the free delivery distance once and never sort
 * the towns by it (Adrian, 2026-10-05).
 */
export const podstronyPoOdleglosci = [...podstrony].sort((a, b) => odlegloscKm(a) - odlegloscKm(b));
