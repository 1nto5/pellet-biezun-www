/**
 * What the company sells: the offer page, the product cards on the home page,
 * the local pages, the choices in the order form and llms.txt all read this
 * list. Prices live here and nowhere else; a page only prints them.
 *
 * Prices are from the client's OLX ads of `cenyZDnia`. Whether they include
 * VAT is not known, so no page says "brutto" or "z VAT".
 *
 * Certificates belong to the producers, not to the company: without a trader's
 * certificate the pages may show the original bags, but never the ENplus mark
 * itself, and the text says whose certificate it is (`certyfikat`).
 */
import type { ImageMetadata } from "astro";
import hitonZdjecie from "../assets/produkty/hiton.jpg";
import wielbarkZdjecie from "../assets/produkty/wielbark.jpg";

/** The date of the ads the prices come from. */
export const cenyZDnia = "30.09.2026";

export interface Parametr {
  nazwa: string;
  wartosc: string;
  /** The ENplus A1 limit, where the source gives it. */
  wymaganie?: string;
}

export interface Zdjecie {
  src: ImageMetadata;
  alt: string;
}

export interface Produkt {
  /** Sent with the order form; keep it stable once orders come in. */
  id: string;
  /** Goes into headings: the name printed on the bag or the origin, never a brand the company may not use. */
  nazwa: string;
  podtytul: string;
  opis: string;
  workiKg: number;
  workowNaPalecie: number;
  kgNaPalecie: number;
  /** Złoty per pallet. */
  cenaPaleta: number;
  /** Złoty per tonne, where the ad gives one. */
  cenaTona?: number;
  certyfikat: string;
  parametry: Parametr[];
  /** Where the parameter values come from, shown under the table. */
  zrodloParametrow: string;
  zdjecie: Zdjecie;
}

export const produkty: Produkt[] = [
  {
    id: "hiton",
    nazwa: "Pellet HITON",
    podtytul: "Pellet drzewny premium, 100% sosna",
    opis: "Pellet z czystego surowca sosnowego, bez dodatków chemicznych i klejów. Nie powstają spieki. Popiół można wykorzystać jako nawóz w ogrodzie.",
    workiKg: 15,
    workowNaPalecie: 65,
    kgNaPalecie: 975,
    cenaPaleta: 2200,
    certyfikat: "Certyfikat DINplus 7A433 i certyfikat ENplus A1 producenta, ID PL 078.",
    parametry: [
      { nazwa: "Wartość opałowa", wartosc: "≥ 5,0 kWh/kg" },
      { nazwa: "Popiół", wartosc: "≤ 0,50%" },
      { nazwa: "Siarka", wartosc: "≤ 0,01%" },
      { nazwa: "Chlor", wartosc: "≤ 0,01%" },
      { nazwa: "Norma", wartosc: "ISO 17225-2, klasa A1" },
    ],
    zrodloParametrow: "dane producenta z worka.",
    zdjecie: { src: hitonZdjecie, alt: "Worek pelletu HITON 15 kg" },
  },
  {
    id: "wielbark",
    nazwa: "Pellet sosnowy z Wielbarku",
    podtytul: "Pellet drzewny sosnowy, 6 mm",
    opis: "Pellet z zakładu IKEA Industry w Wielbarku. Na worku jest napis „Wood Pellets”.",
    workiKg: 15,
    workowNaPalecie: 72,
    kgNaPalecie: 1080,
    cenaPaleta: 2440,
    cenaTona: 2260,
    certyfikat: "Certyfikat ENplus A1 producenta, ID PL 002.",
    parametry: [
      { nazwa: "Wartość opałowa", wartosc: "18,54 MJ/kg (5,15 kWh/kg)", wymaganie: "≥ 16,5 MJ/kg" },
      { nazwa: "Wilgotność", wartosc: "4,2%", wymaganie: "≤ 10%" },
      { nazwa: "Popiół", wartosc: "0,22%", wymaganie: "≤ 0,70%" },
      { nazwa: "Wytrzymałość mechaniczna", wartosc: "98,8%", wymaganie: "≥ 98,0%" },
      { nazwa: "Frakcja drobna", wartosc: "0,31%", wymaganie: "≤ 1,0%" },
      { nazwa: "Średnica / długość", wartosc: "6,1 mm / 15,5 mm", wymaganie: "6 ± 1 mm / 3,15–40 mm" },
      { nazwa: "Gęstość nasypowa", wartosc: "650 kg/m³", wymaganie: "600–750 kg/m³" },
      { nazwa: "Siarka / chlor / azot", wartosc: "0,005% / 0,007% / < 0,08%", wymaganie: "≤ 0,04% / ≤ 0,02% / ≤ 0,3%" },
      { nazwa: "Temperatura deformacji popiołu", wartosc: "1450 °C", wymaganie: "≥ 1200 °C" },
    ],
    zrodloParametrow:
      "Sprawozdanie z badań nr DBL-2026-5826-01-BLS z 09.09.2026, Sieć Badawcza Łukasiewicz – Poznański Instytut Technologiczny (laboratorium akredytowane, PCA AB 053).",
    zdjecie: { src: wielbarkZdjecie, alt: "Worek pelletu z napisem Wood Pellets" },
  },
];

/**
 * "2200 zł / paleta" and, where set, "2260 zł / t" (Polish leaves four-digit
 * numbers ungrouped). The unit stays with its slash, so a narrow column breaks
 * the price as "2200 zł" over "/ paleta", never after the slash.
 */
export function cenyLabel(p: Produkt): string[] {
  const zl = (n: number) => `${n.toLocaleString("pl-PL")} zł`;
  const za = (unit: string) => `/\u00a0${unit}`;
  return [`${zl(p.cenaPaleta)} ${za("paleta")}`, ...(p.cenaTona ? [`${zl(p.cenaTona)} ${za("t")}`] : [])];
}

/** "2200 zł / paleta": the one price every product has. */
export function cenaLabel(p: Produkt): string {
  return cenyLabel(p)[0]!;
}

/** "65 worków × 15 kg = 975 kg", "72 worki × 15 kg = 1080 kg" */
export function paletaLabel(p: Produkt): string {
  return `${p.workowNaPalecie} ${workiOdmiana(p.workowNaPalecie)} × ${p.workiKg} kg = ${p.kgNaPalecie} kg`;
}

/** Polish plural of "worek": 1 worek, 2–4 worki (but 12–14 worków), 5+ worków. */
function workiOdmiana(n: number): string {
  if (n === 1) return "worek";
  const d = n % 10;
  const dd = n % 100;
  return d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? "worki" : "worków";
}

/** "Pellet HITON: certyfikat DINplus 7A433 i …": the certificate sentence under the product's name. */
export function certyfikatZNazwa(p: Produkt): string {
  return `${p.nazwa}: ${p.certyfikat.charAt(0).toLowerCase()}${p.certyfikat.slice(1)}`;
}
