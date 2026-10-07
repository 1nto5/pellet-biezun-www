import type { APIRoute } from "astro";
import { firma, addressLine, hoursRange } from "../data/firma";
import { produkty, cenyLabel, cenaWorkaLabel, paletaLabel, cenyZDnia } from "../data/oferta";
import { ZASADA_DOSTAWY, miejsca, podstronyPoOdleglosci, wojewodztwa, miejsceHref } from "../data/miejsca";
import { flota } from "../data/flota";
import { faq } from "../data/faq";
import { strony } from "../data/nav";
import { pelnaNazwa } from "../lib/miejsce";

/**
 * llms.txt: a short Markdown summary of the company for language models, in
 * the format proposed at llmstxt.org (a title, a one-line summary in a quote,
 * then sections of links). Built from the same data files as the pages, so
 * it cannot drift from them.
 */
export const GET: APIRoute = ({ site }) => {
  // Every link below already carries the site's base (src/lib/url.ts).
  const url = (path: string) => new URL(path, site).toString();
  const body = [
    `# ${firma.name}`,
    "",
    `> ${firma.description}`,
    "",
    `Magazyn: ${addressLine()} (wieś Władysławowo w gminie Bieżuń). Telefon: ${firma.phone.label}.${firma.email ? ` E-mail: ${firma.email}.` : ""}`,
    `Godziny otwarcia: ${firma.hours.map((h) => `${h.label.toLowerCase()} ${hoursRange(h)}`).join(", ")}. ${firma.closedNote}`,
    "Zamówienia przez formularz na stronie albo telefonicznie; strona nie pobiera płatności.",
    "",
    "## Oferta",
    "",
    `Pellet w workach 15 kg na paletach, zapakowanych fabrycznie i przykrytych foliowym kapturem. Ceny z ${cenyZDnia}.`,
    "",
    ...produkty.flatMap((p) => [
      `### ${p.nazwa}`,
      "",
      `${p.podtytul}. ${p.opis}`,
      `Paleta: ${paletaLabel(p)}. Cena: ${cenyLabel(p).join(", ")}${p.cenaWorek ? `, pojedynczy worek ${cenaWorkaLabel(p)}` : ""}.`,
      ...(p.certyfikat ? [p.certyfikat] : []),
      `Parametry: ${p.parametry.map((x) => `${x.nazwa.toLowerCase()} ${x.wartosc}`).join("; ")}. Źródło: ${p.zrodloParametrow}`,
      "",
    ]),
    "## Dostawa",
    "",
    `${ZASADA_DOSTAWY} ` +
      `Własne samochody, każdy z elektrycznym wózkiem paletowym: ${flota.map((f) => `${f.model} (${f.szczegoly.join(", ")})`).join(", ")}. ` +
      "Odbiór osobisty w magazynie po wcześniejszym telefonie. Przy większych zamówieniach cena do negocjacji.",
    "",
    ...podstronyPoOdleglosci.map((m) => `- [Pellet ${m.podstrona.wMiejscowosci}](${url(miejsceHref(m))})`),
    "",
    "Wszystkie miejscowości, do których dowozimy:",
    "",
    ...wojewodztwa
      .map((w) => ({ w, lista: miejsca.filter((m) => m.wojewodztwo === w) }))
      .filter((g) => g.lista.length > 0)
      .map((g) => `- Województwo ${g.w}: ${g.lista.map(pelnaNazwa).join(", ")}`),
    "",
    "## Strony",
    "",
    `- [Oferta i ceny](${url(strony.oferta.href)})`,
    `- [Mapa dystrybucji](${url(strony.mapa.href)})`,
    `- [Galeria](${url(strony.galeria.href)})`,
    `- [Zamówienie](${url(strony.zamowienie.href)})`,
    `- [Kontakt](${url(strony.kontakt.href)})`,
    `- [Częste pytania](${url(strony.faq.href)}): ${faq.length} pytań i odpowiedzi`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
