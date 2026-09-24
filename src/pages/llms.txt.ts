import type { APIRoute } from "astro";
import { firma, addressLine, hoursRange } from "../data/firma";
import { produkty, cenaLabel, parametry } from "../data/oferta";
import { miejsca, miejsceHref } from "../data/miejsca";
import { faq } from "../data/faq";

/**
 * llms.txt: a short Markdown summary of the company for language models, in
 * the format proposed at llmstxt.org (a title, a one-line summary in a quote,
 * then sections of links). Built from the same data files as the pages, so
 * it cannot drift from them.
 */
export const GET: APIRoute = ({ site }) => {
  const url = (path: string) => new URL(path, site).toString();
  const body = [
    `# ${firma.name}`,
    "",
    `> ${firma.description}`,
    "",
    `Adres składu: ${addressLine()}. Telefon: ${firma.phone.label}. E-mail: ${firma.email}.`,
    `Godziny otwarcia: ${firma.hours.map((h) => `${h.label.toLowerCase()} ${hoursRange(h)}`).join(", ")}. ${firma.closedNote}`,
    "Zamówienia przez formularz na stronie albo telefonicznie; strona nie pobiera płatności.",
    "",
    "## Oferta",
    "",
    ...produkty.map((p) => `- ${p.nazwa}: ${cenaLabel(p)}. ${p.forma}.`),
    "",
    `Parametry: ${parametry.map((p) => `${p.nazwa.toLowerCase()} ${p.wartosc}`).join(", ")}.`,
    "",
    "## Dostawa",
    "",
    ...miejsca.map((m) => `- [${m.nazwa}](${url(miejsceHref(m))}): ${m.dostawa}`),
    "",
    "## Strony",
    "",
    `- [Oferta i ceny](${url("/oferta/")})`,
    `- [Mapa dystrybucji](${url("/mapa-dystrybucji/")})`,
    `- [Zamówienie](${url("/zamowienie/")})`,
    `- [Kontakt](${url("/kontakt/")})`,
    `- [Częste pytania](${url("/faq/")}): ${faq.length} pytań i odpowiedzi`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
