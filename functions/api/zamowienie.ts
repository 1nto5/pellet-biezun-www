/**
 * POST /api/zamowienie: the order form. One e-mail to the seller with
 * everything the buyer typed, then a confirmation to the buyer. The steps are
 * in `../lib/formularz.ts`.
 */
import { nazwyProduktow, type ProduktId } from "../../src/data/produkty";
import { BEZ_ZALICZEK } from "../../src/data/zaliczki";
import { EMAIL, obsluz, type Env, type Formularz } from "../lib/formularz";

type PoleZamowienia = "produkt" | "ilosc" | "ulica" | "kod" | "miejscowosc" | "imie" | "telefon" | "email" | "uwagi";

const nazwa = (id: string) => nazwyProduktow[id as ProduktId];

/**
 * A quantity as people write it: "2 palety", "1,5 tony", "30 worków + paleta".
 * Without a dot, slash, colon or @ it cannot carry a link or an address.
 */
const ZWYKLA_ILOSC = /^[\p{L}\p{N} ,+()-]+$/u;

const zamowienie: Formularz<PoleZamowienia> = {
  strona: "/zamowienie/",
  pola: {
    produkt: { wymagane: true, max: 100 },
    // Shorter than the rest: the one thing a buyer types that the confirmation repeats.
    ilosc: { wymagane: true, max: 60 },
    ulica: { wymagane: true, max: 100 },
    kod: { wymagane: true, max: 6, wzor: /^[0-9]{2}-?[0-9]{3}$/ },
    miejscowosc: { wymagane: true, max: 100 },
    imie: { wymagane: true, max: 100 },
    telefon: { wymagane: true, max: 30 },
    email: { wymagane: true, max: 254, wzor: EMAIL },
    uwagi: { max: 2000, wielolinijkowe: true },
  },
  sprawdz: (d) => Object.hasOwn(nazwyProduktow, d.produkt),
  doSprzedawcy: (d, mailTo) => ({
    to: mailTo,
    reply_to: d.email,
    subject: `Zamówienie: ${nazwa(d.produkt)}, ${d.ilosc} (${d.imie})`,
    text: [
      "Nowe zamówienie ze strony.",
      "",
      `Produkt: ${nazwa(d.produkt)}`,
      `Ilość: ${d.ilosc}`,
      "",
      "Adres dostawy:",
      d.ulica,
      `${d.kod} ${d.miejscowosc}`,
      "",
      `Imię i nazwisko: ${d.imie}`,
      `Telefon: ${d.telefon}`,
      `E-mail: ${d.email}`,
      "",
      `Uwagi: ${d.uwagi || "brak"}`,
      "",
      "Odpowiedź na tę wiadomość trafi do zamawiającego.",
    ].join("\n"),
  }),
  // This one goes to an address a stranger typed, so it carries no text of
  // theirs beyond the quantity (one line, capped), and that only when it
  // reads like a quantity: not the notes, not the address, not the name.
  // Otherwise the form could send anyone's words or links to anyone's inbox
  // under the company's name. The seller's mail always has the quantity.
  potwierdzenie: (d, mailTo) => ({
    to: d.email,
    reply_to: mailTo,
    subject: "Przyjęliśmy zamówienie | Pellet Bieżuń",
    text: [
      "Dzień dobry,",
      "",
      "przyjęliśmy zamówienie wysłane z formularza na stronie.",
      "",
      `Produkt: ${nazwa(d.produkt)}`,
      ...(ZWYKLA_ILOSC.test(d.ilosc) ? [`Ilość: ${d.ilosc}`] : []),
      "",
      `Oddzwonimy w ciągu 24 godzin, żeby ustalić termin dostawy i formę płatności. Strona nie pobiera płatności. ${BEZ_ZALICZEK}`,
      "",
      "Jeśli to nie Twoje zamówienie, odpowiedz na tę wiadomość.",
      "",
      "Pellet Bieżuń",
    ].join("\n"),
  }),
};

export const onRequestPost: PagesFunction<Env> = (context) => obsluz(context, zamowienie);
