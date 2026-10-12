/**
 * POST /api/kontakt: the contact form. One e-mail to the seller; a reply to
 * it goes to the sender. The steps are in `../lib/formularz.ts`.
 */
import { EMAIL, obsluz, type Env, type Formularz } from "../lib/formularz";

type PoleKontaktu = "imie" | "email" | "telefon" | "wiadomosc" | "zgoda";

const kontakt: Formularz<PoleKontaktu> = {
  strona: "/kontakt/",
  pola: {
    imie: { wymagane: true, max: 100 },
    email: { wymagane: true, max: 254, wzor: EMAIL },
    telefon: { max: 30 },
    wiadomosc: { wymagane: true, max: 2000, wielolinijkowe: true },
    // The consent checkbox; unticked, a browser sends nothing for it.
    zgoda: { wymagane: true, max: 3, wzor: /^tak$/ },
  },
  doSprzedawcy: (d, mailTo) => ({
    to: mailTo,
    reply_to: d.email,
    subject: `Wiadomość ze strony (${d.imie})`,
    text: [
      "Nowa wiadomość z formularza kontaktowego.",
      "",
      `Imię: ${d.imie}`,
      `E-mail: ${d.email}`,
      `Telefon: ${d.telefon || "nie podano"}`,
      "Zgoda na przetwarzanie danych w celu odpowiedzi: tak",
      "",
      "Wiadomość:",
      d.wiadomosc,
      "",
      "Odpowiedź na tę wiadomość trafi do nadawcy.",
    ].join("\n"),
  }),
};

export const onRequestPost: PagesFunction<Env> = (context) => obsluz(context, kontakt);
