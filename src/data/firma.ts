/**
 * The company's details: one copy for every page, the footer, the JSON-LD and
 * llms.txt. The same name, address and phone everywhere is what local search
 * checks, so nothing here is ever retyped on a page.
 *
 * Every value marked PRZYKŁAD is made up until the client sends the real one.
 * `href` of a phone is never written by hand: `phone()` builds it from the label.
 */
import type { Geo } from "../lib/geo";

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
  name: "Pellet Bieżuń", // PRZYKŁAD
  /** The registered name, for the privacy policy and the footer. */
  legalName: "Pellet Bieżuń Jan Kowalski", // PRZYKŁAD
  nip: "000-000-00-00", // PRZYKŁAD
  description: "Sprzedaż pelletu drzewnego w workach, big bagach i luzem, z dostawą w okolicach Bieżunia.", // PRZYKŁAD
  address: {
    street: "ul. Przykładowa 1", // PRZYKŁAD
    postalCode: "09-320",
    city: "Bieżuń",
  } satisfies PostalAddress,
  /** The yard's pin on the map and the point delivery distances are measured from. */
  geo: { lat: 52.9617, lng: 19.8886 } satisfies Geo, // PRZYKŁAD: centre of Bieżuń
  phone: phone("500 000 000"), // PRZYKŁAD
  email: "kontakt@pelletbiezun.pl", // PRZYKŁAD
  hours: [
    { label: "Poniedziałek–piątek", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "16:00" },
    { label: "Sobota", days: ["Saturday"], opens: "08:00", closes: "13:00" },
  ] satisfies OpeningHours[], // PRZYKŁAD
  /** Shown under the hours, for the days the table leaves out. */
  closedNote: "Niedziela i święta: nieczynne.", // PRZYKŁAD
};

/** "ul. Przykładowa 1, 09-320 Bieżuń" */
export function addressLine(a: PostalAddress = firma.address): string {
  return `${a.street}, ${a.postalCode} ${a.city}`;
}

/** "8:00–16:00", from the 24-hour strings above. */
export function hoursRange(h: OpeningHours): string {
  const short = (t: string) => t.replace(/^0/, "");
  return `${short(h.opens)}–${short(h.closes)}`;
}
