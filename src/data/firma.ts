/**
 * The company's details: one copy for every page, the footer, the JSON-LD and
 * llms.txt. The same name, address and phone everywhere is what local search
 * checks, so nothing here is ever retyped on a page.
 *
 * Name, address, coordinates and phone are the client's. What is not known or
 * not confirmed yet is marked TODO(produkcja). A value that is not known is
 * left out (undefined), and the pages show nothing in its place rather than a
 * made-up one.
 * `href` of a phone is never written by hand: `phone()` builds it from the label.
 */
import type { Geo } from "../lib/geo";
import { absoluteUrl } from "../lib/url";

export interface Phone {
  label: string;
  href: string;
}

/** A Polish number written in any spacing → label as given, `tel:` link in E.164. */
function phone(label: string): Phone {
  return { label, href: `tel:+48${label.replace(/\D/g, "")}` };
}

export interface PostalAddress {
  street: string;
  postalCode: string;
  city: string;
  /** The voivodeship, for the JSON-LD. */
  region: string;
}

/** Schema.org day names; the JSON-LD needs these, the pages use `label`. */
export type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface OpeningHours {
  label: string;
  days: Day[];
  opens: string;
  closes: string;
}

export const firma = {
  /** The name as customers know it: header, titles, map pin. */
  name: "Pellet Bieżuń",
  /** The name's two words, set one under the other in the logo and on the signs. */
  znak: ["Pellet", "Bieżuń"] as const,
  /** The registered name, for the privacy policy and the footer. */
  // TODO(produkcja): the name on OLX; confirm it is the registered one.
  legalName: "Anna Bruzda Sprzedaż Hurtowa i Detaliczna",
  /** The tax number, after the registered name; shown only once known. */
  // TODO(produkcja): the client's NIP, written "123-456-78-90".
  nip: undefined as string | undefined,
  description:
    "Pellet opałowy w workach 15 kg. Dowozimy własnymi autami z windą, dostawa gratis 80 km od Bieżunia. Odbiór w magazynie we Władysławowie.",
  address: {
    street: "Władysławowo 10",
    postalCode: "09-320",
    city: "Bieżuń",
    region: "mazowieckie",
  } satisfies PostalAddress,
  /** "od Bieżunia": the town in the genitive, for sentences about distance. */
  odMiasta: "od Bieżunia",
  /** The warehouse's pin on the map and the point delivery distances are measured from. */
  geo: { lat: 52.9281292, lng: 19.8770384 } satisfies Geo,
  phone: phone("792 360 360"),
  /** Shown with the phone, in the JSON-LD and llms.txt; only once there is one. */
  // TODO(produkcja): an address that works, e.g. kontakt@ on the site's domain once it is bought.
  email: undefined as string | undefined,
  // From the company's Google Business Profile (2026-10-01).
  // TODO(produkcja): confirm the hours with the client.
  hours: [
    { label: "Poniedziałek–piątek", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "07:00", closes: "17:00" },
    { label: "Sobota", days: ["Saturday"], opens: "07:00", closes: "14:00" },
  ] satisfies OpeningHours[],
  /** Shown under the hours, for the days the table leaves out. */
  closedNote: "Niedziela: nieczynne.",
  /** The company's Google Business Profile, for the JSON-LD `sameAs`. */
  googleMaps: "https://maps.google.com/?cid=4869671231987334697",
};

/** The company's JSON-LD `@id` (Base.astro), for the other JSON-LD objects to point at. */
export const firmaId = `${absoluteUrl("/")}#firma`;

/** "Władysławowo 10, 09-320 Bieżuń" */
export function addressLine(a: PostalAddress = firma.address): string {
  return `${a.street}, ${a.postalCode} ${a.city}`;
}

/** "7:00–17:00", from the 24-hour strings above. */
export function hoursRange(h: OpeningHours): string {
  const short = (t: string) => t.replace(/^0/, "");
  return `${short(h.opens)}–${short(h.closes)}`;
}
