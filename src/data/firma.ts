/**
 * The company's details: one copy for every page, the footer, the JSON-LD and
 * llms.txt. The same name, address and phone everywhere is what local search
 * checks, so nothing here is ever retyped on a page.
 *
 * Name, address, coordinates and phone are the client's. The values still
 * marked PRZYKŁAD (legal name, NIP, e-mail, hours) are made up or unconfirmed
 * until the client sends the real ones.
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
  /** The registered name, for the privacy policy and the footer. */
  legalName: "Anna Bruzda Sprzedaż Hurtowa i Detaliczna", // PRZYKŁAD: the name on OLX, not confirmed as the registered one
  nip: "000-000-00-00", // PRZYKŁAD
  description:
    "Sprzedaż certyfikowanego pelletu drzewnego w workach 15 kg na paletach. Magazyn we Władysławowie pod Bieżuniem, dostawa gratis w promieniu ok. 80 km.",
  address: {
    street: "Władysławowo 10",
    postalCode: "09-320",
    city: "Bieżuń",
  } satisfies PostalAddress,
  /** "od Bieżunia": the town in the genitive, for sentences about distance. */
  odMiasta: "od Bieżunia",
  /** The warehouse's pin on the map and the point delivery distances are measured from. */
  geo: { lat: 52.9281292, lng: 19.8770384 } satisfies Geo,
  phone: phone("792 360 360"),
  email: "kontakt@pelletbiezun.pl", // PRZYKŁAD
  // From the company's Google Business Profile (2026-10-01); the client has
  // not confirmed them yet.
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

/** "8:00–16:00", from the 24-hour strings above. */
export function hoursRange(h: OpeningHours): string {
  const short = (t: string) => t.replace(/^0/, "");
  return `${short(h.opens)}–${short(h.closes)}`;
}
