/**
 * Questions and answers: the FAQ page and its FAQPage JSON-LD. Answers are
 * plain text, because the JSON-LD needs them without markup.
 *
 * Only what the client has confirmed. Payment, minimum order, delivery times
 * and single bags are left out until they are known. Prices are not repeated
 * here: they live in `oferta.ts`.
 */
import { firma, addressLine } from "./firma";
import { produkty, paletaLabel, certyfikatZNazwa } from "./oferta";
import { DARMOWA_DOSTAWA_KM } from "./miejsca";

export const faq: { q: string; a: string }[] = [
  {
    q: "Ile worków jest na palecie?",
    a: `${produkty.map((p) => `${p.nazwa}: ${paletaLabel(p)}`).join(". ")}. Palety są zapakowane fabrycznie.`,
  },
  {
    q: "Ile kosztuje dostawa?",
    a: `W promieniu ok. ${DARMOWA_DOSTAWA_KM} km od magazynu (w linii prostej) dostawa jest gratis. Dalej warunki ustalamy indywidualnie – zadzwoń: ${firma.phone.label}.`,
  },
  {
    q: "Jak wygląda rozładunek?",
    a: "Każdy nasz samochód ma windę i elektryczny wózek paletowy, więc paletę zdejmujemy z auta i podwozimy na miejsce. Na ciasne dojazdy mamy mniejsze auta Iveco Daily.",
  },
  {
    q: "Czy pellet można trzymać na zewnątrz?",
    a: "Tak. Palety są fabrycznie zapakowane i przykryte foliowym kapturem, który chroni worki przed deszczem.",
  },
  {
    q: "Jakie certyfikaty ma pellet?",
    a: produkty.map(certyfikatZNazwa).join(" "),
  },
  {
    q: "Do jakich kotłów nadaje się ten pellet?",
    a: "Oba rodzaje z naszej oferty to certyfikowany pellet drzewny wysokiej jakości, doskonały do kotłów 5. generacji.",
  },
  {
    q: "Czy mogę odebrać pellet osobiście?",
    a: `Tak, z magazynu: ${addressLine()}. Przed przyjazdem zadzwoń pod ${firma.phone.label}.`,
  },
  {
    q: "Czy przy większym zamówieniu cena jest niższa?",
    a: "Przy większych zamówieniach cena jest do negocjacji. Zadzwoń, a ustalimy warunki.",
  },
  {
    q: "Co zrobić z popiołem?",
    a: "Popiół z pelletu HITON, który jest w 100% sosnowy i bez dodatków chemicznych, można wykorzystać jako nawóz w ogrodzie.",
  },
];
