/**
 * What the company sells: the offer page, the product list on the home page
 * and the choices in the order form all read this list.
 *
 * `cena` is in złoty per `jednostka`, or null for "cena na zapytanie".
 * All of it is PRZYKŁAD until the client sends the real range and prices.
 */
export interface Produkt {
  /** Sent with the order form; keep it stable once orders come in. */
  id: string;
  nazwa: string;
  forma: string;
  opis: string;
  cena: number | null;
  jednostka: string;
  przykladowe: boolean;
}

export const produkty: Produkt[] = [
  {
    id: "worki-15kg",
    nazwa: "Pellet w workach 15 kg",
    forma: "Paleta 65 worków (975 kg), także pojedyncze worki na miejscu",
    opis: "Najwygodniejszy do domowej kotłowni: worek przeniesie jedna osoba, a folia chroni pellet przed wilgocią.",
    cena: 1290,
    jednostka: "t",
    przykladowe: true,
  },
  {
    id: "big-bag",
    nazwa: "Pellet w big bagu",
    forma: "Worek typu big bag, ok. 1 t",
    opis: "Dla kotłowni z zasobnikiem lub silosem. Mniej opakowań, niższa cena za tonę.",
    cena: 1220,
    jednostka: "t",
    przykladowe: true,
  },
  {
    id: "luz",
    nazwa: "Pellet luzem",
    forma: "Dostawa wdmuchiwana do silosu, od 3 t",
    opis: "Dla dużych odbiorców i silosów. Termin i koszt dostawy ustalamy indywidualnie.",
    cena: null,
    jednostka: "t",
    przykladowe: true,
  },
];

/** "1290 zł / t" (Polish leaves four-digit numbers ungrouped), or "cena na zapytanie". */
export function cenaLabel(p: Produkt): string {
  if (p.cena === null) return "cena na zapytanie";
  return `${p.cena.toLocaleString("pl-PL")} zł / ${p.jednostka}`;
}

/**
 * The pellet's parameters, as a table on the offer page. These are the limits
 * of the ENplus A1 class; PRZYKŁAD until the client confirms the certificate
 * and the values from their own lab sheet.
 */
export const parametry: { nazwa: string; wartosc: string }[] = [
  { nazwa: "Średnica", wartosc: "6 mm" },
  { nazwa: "Długość", wartosc: "3,15–40 mm" },
  { nazwa: "Wartość opałowa", wartosc: "≥ 16,5 MJ/kg" },
  { nazwa: "Wilgotność", wartosc: "≤ 10%" },
  { nazwa: "Zawartość popiołu", wartosc: "≤ 0,7%" },
  { nazwa: "Klasa", wartosc: "ENplus A1" },
];
