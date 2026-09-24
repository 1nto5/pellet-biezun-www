/**
 * The places the company sells or delivers pellet: one list for the map on
 * /mapa-dystrybucji/, the page of each place under /dostawa/<slug>/, the
 * delivery area in the JSON-LD and llms.txt. Adding a place here adds its pin
 * and its page; nothing else needs touching.
 *
 * `rodzaj`:
 * - "punkt": pellet can be bought or collected there; `adres` says where.
 * - "dostawa": a town the company delivers to.
 *
 * `slug` is the part of the address after /dostawa/: lowercase, no Polish
 * letters, written by hand so a renamed place keeps its old address.
 *
 * The whole list is PRZYKŁAD: real towns around Bieżuń with made-up details,
 * until the client sends where they actually deliver.
 */
import type { Geo } from "../lib/geo";

export interface Miejsce {
  slug: string;
  nazwa: string;
  /** "w Sierpcu": the form the local page's sentences need. */
  wMiejscowosci: string;
  rodzaj: "punkt" | "dostawa";
  geo: Geo;
  adres?: string;
  /** Plain sentence, e.g. "Dostawa gratis od 2 palet." */
  dostawa: string;
  opis?: string;
  przykladowe: boolean;
}

export const miejsca: Miejsce[] = [
  {
    slug: "biezun",
    nazwa: "Bieżuń",
    wMiejscowosci: "w Bieżuniu",
    rodzaj: "punkt",
    geo: { lat: 52.9617, lng: 19.8886 },
    adres: "ul. Przykładowa 1",
    dostawa: "Odbiór osobisty ze składu albo dostawa gratis na terenie gminy.",
    opis: "Nasz skład. Na miejscu pellet w workach i big bagach, załadunek wózkiem widłowym.",
    przykladowe: true,
  },
  {
    slug: "zuromin",
    nazwa: "Żuromin",
    wMiejscowosci: "w Żurominie",
    rodzaj: "dostawa",
    geo: { lat: 53.0661, lng: 19.9086 },
    dostawa: "Dostawa gratis od 2 palet, poniżej 80 zł.",
    przykladowe: true,
  },
  {
    slug: "sierpc",
    nazwa: "Sierpc",
    wMiejscowosci: "w Sierpcu",
    rodzaj: "punkt",
    geo: { lat: 52.8564, lng: 19.669 },
    adres: "ul. Przykładowa 10 (punkt partnerski)",
    dostawa: "Odbiór w punkcie partnerskim albo dostawa gratis od 3 palet.",
    przykladowe: true,
  },
  {
    slug: "raciaz",
    nazwa: "Raciąż",
    wMiejscowosci: "w Raciążu",
    rodzaj: "dostawa",
    geo: { lat: 52.7797, lng: 20.1164 },
    dostawa: "Dostawa gratis od 3 palet, poniżej 120 zł.",
    przykladowe: true,
  },
  {
    slug: "szrensk",
    nazwa: "Szreńsk",
    wMiejscowosci: "w Szreńsku",
    rodzaj: "dostawa",
    geo: { lat: 52.983, lng: 20.117 },
    dostawa: "Dostawa gratis od 2 palet, poniżej 80 zł.",
    przykladowe: true,
  },
  {
    slug: "lubowidz",
    nazwa: "Lubowidz",
    wMiejscowosci: "w Lubowidzu",
    rodzaj: "dostawa",
    geo: { lat: 53.135, lng: 19.7875 },
    dostawa: "Dostawa gratis od 3 palet, poniżej 120 zł.",
    przykladowe: true,
  },
  {
    slug: "mlawa",
    nazwa: "Mława",
    wMiejscowosci: "w Mławie",
    rodzaj: "dostawa",
    geo: { lat: 53.1122, lng: 20.3846 },
    dostawa: "Dostawa od 4 palet, koszt ustalamy przy zamówieniu.",
    przykladowe: true,
  },
];

export const miejsceHref = (m: Miejsce) => `/dostawa/${m.slug}/`;
