/**
 * What the company sells: the offer page, the product cards on the home page,
 * the local pages, the choices in the order form and llms.txt all read this
 * list. Prices live here and nowhere else; a page only prints them.
 *
 * Prices are the client's own, from the corrections document of 2026-10-13,
 * as of `cenyZDnia`: per pallet, per 15 kg bag and per tonne for each
 * product. Whether they include VAT is not known, so no page says "brutto"
 * or "z VAT".
 *
 * Certificates belong to the producers, not to the company: without a trader's
 * certificate the pages may show the original bags, but never the ENplus mark
 * itself, and the text says whose certificate it is (`certyfikat`).
 *
 * The Wielbark pellet's name states its origin with "IKEA": the client's wish,
 * decided by the owner on 2026-10-12. The IKEA logo is still never used.
 */
import type { ImageMetadata } from "astro";
import hitonZdjecie from "../assets/produkty/hiton.jpg";
import hitonPaleta from "../assets/produkty/hiton-paleta.jpg";
import wielbarkZdjecie from "../assets/produkty/wielbark.jpg";
import wielbarkPaleta from "../assets/produkty/wielbark-paleta.jpg";
import { nazwyProduktow, type ProduktId } from "./produkty";

/** The date the client gave the prices for. */
// TODO(produkcja): ask the client whether the prices include VAT.
export const cenyZDnia = "01.10.2026";

export interface Parametr {
  nazwa: string;
  wartosc: string;
  /** The ENplus A1 limit, where the source gives it. */
  wymaganie?: string;
}

export interface Dokument {
  /** The link's text, with the file's kind and size: "Sprawozdanie z badań (PDF, 0,4 MB)". */
  etykieta: string;
  /** The file's address in `public/`, without the site's base: the pages put it through `href()`. */
  plik: `/${string}`;
}

export interface Zdjecie {
  src: ImageMetadata;
  alt: string;
}

export interface Produkt {
  /** Sent with the order form; keep it stable once orders come in. The ids and names live in produkty.ts. */
  id: ProduktId;
  /**
   * Goes into headings: the name printed on the bag or the origin. The
   * Wielbark pellet's says "IKEA" (the owner's decision of 2026-10-12, at the
   * client's wish); no page shows the IKEA logo.
   */
  nazwa: string;
  podtytul: string;
  opis: string;
  workiKg: number;
  workowNaPalecie: number;
  kgNaPalecie: number;
  /** Złoty per pallet. */
  cenaPaleta: number;
  /** Złoty per tonne, where the client gives one. */
  cenaTona?: number;
  /** Złoty per single bag, where the product is also sold by the bag. */
  cenaWorek?: number;
  /** Left out where neither the bag nor the ad names one; the pages then say nothing about a certificate. */
  certyfikat?: string;
  parametry: Parametr[];
  /** Where the parameter values come from, shown under the table. */
  zrodloParametrow: string;
  /** A file to read under the parameters: the test report, later a certificate. Only what the client has sent. */
  dokument?: Dokument;
  zdjecie: Zdjecie;
  /** The whole pallet as it leaves the warehouse: the client's photo, cut out of its background. Only the offer page shows it, small, under the bag. */
  paleta?: Zdjecie;
}

export const produkty: Produkt[] = [
  {
    id: "hiton",
    nazwa: nazwyProduktow.hiton,
    podtytul: "Pellet drzewny certyfikowany, 100% sosna, średnica 6\u00a0mm",
    opis: "Pellet z czystych trocin sosnowych, bez dodatków chemicznych, klejów i innych zanieczyszczeń. Ma stałe, powtarzalne parametry i nie tworzy spieków. Siarki jest bardzo mało, co chroni kocioł przed korozją. Popiół można wykorzystać jako nawóz w ogrodzie.",
    workiKg: 15,
    workowNaPalecie: 65,
    kgNaPalecie: 975,
    cenaPaleta: 2200,
    cenaTona: 2257,
    cenaWorek: 34,
    certyfikat: "Certyfikat DINplus 7A433 i certyfikat ENplus A1 producenta, ID PL 078.",
    parametry: [
      { nazwa: "Wartość opałowa", wartosc: "≥ 18,0 MJ/kg (≥ 5,0 kWh/kg)" },
      { nazwa: "Popiół", wartosc: "≤ 0,50%" },
      { nazwa: "Siarka", wartosc: "≤ 0,01%" },
      { nazwa: "Chlor", wartosc: "≤ 0,01%" },
      { nazwa: "Norma", wartosc: "ISO 17225-2, klasa A1" },
    ],
    zrodloParametrow: "dane producenta z worka.",
    zdjecie: { src: hitonZdjecie, alt: "Worek pelletu HITON 15 kg" },
    paleta: { src: hitonPaleta, alt: "Paleta czarnych worków pelletu HITON 15 kg owinięta folią" },
  },
  {
    id: "wielbark",
    nazwa: nazwyProduktow.wielbark,
    podtytul: "Pellet drzewny certyfikowany, 100% sosna, średnica 6\u00a0mm",
    opis: "Pellet z zakładu IKEA Industry w Wielbarku, z mocno sprasowanych czystych trocin sosnowych, bez kory i innych dodatków. Daje mało popiołu i nie tworzy spieków. Jego jakość jest zawsze taka sama, bardzo wysoka.",
    workiKg: 15,
    workowNaPalecie: 72,
    kgNaPalecie: 1080,
    cenaPaleta: 2440,
    cenaTona: 2260,
    cenaWorek: 34,
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
      "sprawozdanie z badań nr DBL-2026-5826-01-BLS z 09.09.2026, Sieć Badawcza Łukasiewicz – Poznański Instytut Technologiczny (laboratorium akredytowane, PCA AB 053).",
    // The laboratory's report as the client sent it on 2026-10-13, 409 938 bytes.
    dokument: {
      etykieta: "Sprawozdanie z badań (PDF, 0,4\u00a0MB)",
      plik: "/dokumenty/sprawozdanie-z-badan-wood-pellets-ikea-wielbark.pdf",
    },
    zdjecie: { src: wielbarkZdjecie, alt: "Worek pelletu z napisem „Wood Pellets”" },
    paleta: { src: wielbarkPaleta, alt: "Paleta worków Wood Pellets 15 kg owinięta folią" },
  },
];

/**
 * The prices in the order the pages show them: "2200 zł / paleta", then,
 * where set, "34 zł / worek 15 kg" and "2257 zł / t" (Polish leaves
 * four-digit numbers ungrouped). The unit stays with its slash, so a narrow
 * column breaks the price as "2200 zł" over "/ paleta", never after the slash.
 */
export function cenyLabel(p: Produkt): string[] {
  // The number stays with its "zł"; a line may break only before the "/".
  const zl = (n: number) => `${n.toLocaleString("pl-PL")}\u00a0zł`;
  const za = (unit: string) => `/\u00a0${unit}`;
  return [
    `${zl(p.cenaPaleta)} ${za("paleta")}`,
    ...(p.cenaWorek ? [`${zl(p.cenaWorek)} ${za(`worek\u00a0${p.workiKg}\u00a0kg`)}`] : []),
    ...(p.cenaTona ? [`${zl(p.cenaTona)} ${za("t")}`] : []),
  ];
}

/** "2200 zł / paleta": the one price every product has, and the one the pages set on the yellow tag. */
export function cenaLabel(p: Produkt): string {
  return cenyLabel(p)[0]!;
}

/**
 * The products also sold by the bag, in sentences: one for each bag price,
 * naming every product sold at it. "Pellet HITON i Wood Pellets z IKEA
 * Wielbark" with "34 zł za worek 15 kg" while both cost the same.
 */
export function naWorki(): { nazwy: string; cena: string }[] {
  const grupy = new Map<string, string[]>();
  for (const p of produkty) {
    if (!p.cenaWorek) continue;
    const cena = `${p.cenaWorek.toLocaleString("pl-PL")}\u00a0zł za worek ${p.workiKg} kg`;
    grupy.set(cena, [...(grupy.get(cena) ?? []), p.nazwa]);
  }
  return [...grupy].map(([cena, nazwy]) => ({ nazwy: wylicz(nazwy), cena }));
}

/** "A", "A i B", "A, B i C". */
function wylicz(nazwy: string[]): string {
  return nazwy.length < 2 ? nazwy.join("") : `${nazwy.slice(0, -1).join(", ")} i ${nazwy.at(-1)}`;
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

/** "Pellet HITON: certyfikat DINplus 7A433 i …": the certificate sentence under the product's name; undefined without a certificate. */
export function certyfikatZNazwa(p: Produkt): string | undefined {
  if (!p.certyfikat) return undefined;
  return `${p.nazwa}: ${p.certyfikat.charAt(0).toLowerCase()}${p.certyfikat.slice(1)}`;
}
