/**
 * What the company sells: the offer page, the product cards on the home page,
 * the local pages, the choices in the order form and llms.txt all read this
 * list. Prices live here and nowhere else; a page only prints them.
 *
 * Prices are the client's own, from the client's message of 2026-10-24,
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
import { href } from "../lib/url";

/** The date the client gave the prices for. */
// TODO(produkcja): ask the client whether the prices include VAT.
export const cenyZDnia = "24.10.2026";

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
  /** The product's own page: /oferta/<slug>/ (`produktHref`). Keep it stable once the page is indexed. */
  slug: string;
  /**
   * The product page's h1, in the words people search for, so the page title
   * and the breadcrumbs start with them too. Not the product's name: the
   * Wielbark pellet's h1 is "Pellet IKEA Wielbark", its name stays under it.
   */
  naglowek: string;
  /** The product page's description for search engines (`opisStrony`): its first words, then what sets the product apart. Titles and descriptions say "opałowy", the text "drzewny". */
  opisStrony: { poczatek: string; wyroznik: string };
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
  /** Złoty per single bag, where the product is also sold by the bag; may have grosze (32.5). */
  cenaWorek?: number;
  /** Left out where neither the bag nor the ad names one; the pages then say nothing about a certificate. */
  certyfikat?: string;
  parametry: Parametr[];
  /** Where the parameter values come from, shown under the table. */
  zrodloParametrow: string;
  /** A file to read under the parameters: the test report, later a certificate. Only what the client has sent. */
  dokument?: Dokument;
  zdjecie: Zdjecie;
  /** The client's photos of this product in the gallery, by file name in `src/assets/galeria/`; the product page shows them. */
  galeria: string[];
  /** The whole pallet as it leaves the warehouse: the client's photo, cut out of its background. The offer page and the product pages show it, small, beside the price. */
  paleta?: Zdjecie;
}

export const produkty: Produkt[] = [
  {
    id: "hiton",
    slug: "pellet-hiton",
    naglowek: "Pellet HITON",
    opisStrony: { poczatek: "Pellet opałowy HITON", wyroznik: "Certyfikat DINplus i ENplus A1 producenta, parametry" },
    nazwa: nazwyProduktow.hiton,
    podtytul: "Pellet drzewny certyfikowany, 100% sosna, średnica 6\u00a0mm",
    opis: "Pellet z czystych trocin sosnowych, bez dodatków chemicznych, klejów i innych zanieczyszczeń. Ma stałe, powtarzalne parametry i nie tworzy spieków. Siarki jest bardzo mało, co chroni kocioł przed korozją. Popiół można wykorzystać jako nawóz w ogrodzie.",
    workiKg: 15,
    workowNaPalecie: 65,
    kgNaPalecie: 975,
    cenaPaleta: 2100,
    cenaTona: 2154,
    cenaWorek: 33.5,
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
    galeria: ["05-hiton-palety", "11-hiton-worki", "15-hiton-granulat"],
    paleta: { src: hitonPaleta, alt: "Paleta czarnych worków pelletu HITON 15 kg owinięta folią" },
  },
  {
    id: "wielbark",
    slug: "pellet-ikea-wielbark",
    naglowek: "Pellet IKEA Wielbark",
    opisStrony: {
      poczatek: "Pellet opałowy IKEA Wielbark (Wood Pellets)",
      wyroznik: "Certyfikat ENplus A1 producenta, wyniki badań z laboratorium",
    },
    nazwa: nazwyProduktow.wielbark,
    podtytul: "Pellet drzewny certyfikowany, 100% sosna, średnica 6\u00a0mm",
    opis: "Pellet z zakładu IKEA Industry w Wielbarku, z mocno sprasowanych czystych trocin sosnowych, bez kory i innych dodatków. Daje mało popiołu i nie tworzy spieków. Jego jakość jest zawsze taka sama, bardzo wysoka.",
    workiKg: 15,
    workowNaPalecie: 72,
    kgNaPalecie: 1080,
    cenaPaleta: 2350,
    cenaTona: 2176,
    cenaWorek: 32.5,
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
    galeria: [
      "23-magazyn-hala",
      "24-magazyn-wood-pellets",
      "25-wood-pellets-trzy-palety",
      "26-wood-pellets-paleta",
      "27-wood-pellets-z-gory",
      "28-magazyn-rzad-palet",
    ],
    paleta: { src: wielbarkPaleta, alt: "Paleta worków Wood Pellets 15 kg owinięta folią" },
  },
];

/** "/oferta/pellet-hiton/": the product's own page, with the site's base. */
export const produktHref = (p: Produkt) => href(`/oferta/${p.slug}/`);

/** "Pellet HITON: cena, parametry, dostawa": the product page's title, before the site's name. */
export const tytulStrony = (p: Produkt) => `${p.naglowek}: cena, parametry, dostawa`;

/**
 * The product page's description: "Pellet opałowy HITON w workach 15 kg,
 * 2200 zł za paletę (65 worków, 975 kg). Certyfikat …, dostawa gratis."
 * Search results keep the slogan "dostawa gratis" (zasady-tekstow.md).
 */
export function opisStrony(p: Produkt): string {
  const { poczatek, wyroznik } = p.opisStrony;
  const cena = `${kwota(p.cenaPaleta)} zł za paletę`;
  const paleta = `${p.workowNaPalecie} ${workiOdmiana(p.workowNaPalecie)}, ${p.kgNaPalecie} kg`;
  return `${poczatek} w workach ${p.workiKg} kg, ${cena} (${paleta}). ${wyroznik}, dostawa gratis.`;
}

/**
 * The prices in the order the pages show them: "2200 zł / paleta", then,
 * where set, "34 zł / worek 15 kg" and "2257 zł / t" (Polish leaves
 * four-digit numbers ungrouped). The unit stays with its slash, so a narrow
 * column breaks the price as "2200 zł" over "/ paleta", never after the slash.
 */
export function cenyLabel(p: Produkt): string[] {
  // The number stays with its "zł"; a line may break only before the "/".
  const zl = (n: number) => `${kwota(n)}\u00a0zł`;
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
 * naming every product sold at it. "Pellet HITON i Wood Pellets IKEA
 * Wielbark" with "33 zł za worek 15 kg" while both cost the same.
 */
export function naWorki(): { nazwy: string; cena: string }[] {
  const grupy = new Map<string, string[]>();
  for (const p of produkty) {
    if (!p.cenaWorek) continue;
    const cena = `${kwota(p.cenaWorek)}\u00a0zł za worek ${p.workiKg} kg`;
    grupy.set(cena, [...(grupy.get(cena) ?? []), p.nazwa]);
  }
  return [...grupy].map(([cena, nazwy]) => ({ nazwy: wylicz(nazwy), cena }));
}

/** "2100", "32,50": whole złoty without grosze, otherwise always both digits of the grosze. */
function kwota(n: number): string {
  const grosze = Number.isInteger(n) ? 0 : 2;
  return n.toLocaleString("pl-PL", { minimumFractionDigits: grosze, maximumFractionDigits: grosze });
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
