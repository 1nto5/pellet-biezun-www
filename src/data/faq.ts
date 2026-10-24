/**
 * Questions and answers: the FAQ page and its FAQPage JSON-LD. Answers are
 * plain text, because the JSON-LD needs them without markup.
 *
 * Only what the client has confirmed. Payment (beyond "no advance
 * payments", zaliczki.ts), minimum order and delivery times are left out
 * until they are known; single bags only for the products
 * that have a bag price. Prices live in `oferta.ts` and are only printed here.
 */
import { firma, addressLine } from "./firma";
import { produkty, paletaLabel, certyfikatZNazwa, naWorki } from "./oferta";
import { ZASADA_DOSTAWY } from "./miejsca";
import { BEZ_ZALICZEK } from "./zaliczki";

export const faq: { q: string; a: string }[] = [
  {
    q: "Ile worków jest na palecie?",
    a: `${produkty.map((p) => `${p.nazwa}: ${paletaLabel(p)}`).join(". ")}.`,
  },
  ...(naWorki().length > 0
    ? [
        {
          q: "Czy można kupić pojedyncze worki?",
          a: `${naWorki()
            .map((g) => `${g.nazwy} sprzedajemy też na worki: ${g.cena}`)
            .join(". ")}. Zadzwoń pod ${firma.phone.label}, a ustalimy odbiór albo dostawę.`,
        },
      ]
    : []),
  {
    q: "Ile kosztuje dostawa?",
    a: ZASADA_DOSTAWY,
  },
  {
    q: "Czy trzeba wpłacić zaliczkę?",
    a: `Nie. ${BEZ_ZALICZEK} Jeśli ktoś podaje się za nas i prosi o wpłatę z góry, zadzwoń pod ${firma.phone.label}.`,
  },
  {
    q: "Jak wygląda rozładunek?",
    a: "Każdy nasz samochód ma windę i elektryczny wózek paletowy, paletę zdejmujemy z auta i podwozimy na miejsce. Na dojazd w trudno dostępne miejsca mamy mniejsze auta Iveco Daily.",
  },
  {
    q: "Czy pellet można trzymać na zewnątrz?",
    a: "Tak. Palety są fabrycznie zapakowane i przykryte foliowym kapturem, który chroni worki przed deszczem.",
  },
  {
    q: "Jakie certyfikaty ma pellet?",
    a: produkty.flatMap((p) => certyfikatZNazwa(p) ?? []).join(" "),
  },
  {
    q: "Do jakich kotłów nadaje się ten pellet?",
    a: "Pellet HITON i Wood Pellets IKEA Wielbark to certyfikowany pellet drzewny wysokiej jakości, doskonały do kotłów 5. generacji. Mają bardzo mało siarki, co chroni kocioł przed korozją.",
  },
  {
    q: "Czy mogę odebrać pellet osobiście?",
    a: `Tak, z magazynu: ${addressLine()}. Przed przyjazdem zadzwoń pod ${firma.phone.label}.`,
  },
  {
    q: "Czy przy większym zamówieniu cena jest niższa?",
    a: "Przy większym zamówieniu cena do negocjacji.",
  },
  {
    q: "Co zrobić z popiołem?",
    a: "Popiół z pelletu HITON, który jest w 100% sosnowy i bez dodatków chemicznych, można wykorzystać jako nawóz w ogrodzie.",
  },
];
