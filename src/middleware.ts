import { defineMiddleware } from "astro:middleware";

/**
 * Polish typography on every HTML page, with non-breaking spaces:
 * - after one-letter words (w, z, i, a, o, u), so they never end a line,
 *   also where the source breaks the line after one or puts a link after it,
 *   and after "do", "od", "we" and "ze" before a town's name;
 * - between a number and its unit or the thing it counts (15 kg, 80 km,
 *   2200 zł, 6 mm, 18 MJ/kg, 26 palet, 65 worków, 5 lat, 5. generacji);
 * - after "ok.", "tel.", "nr", "art.", "ust.", "lit.", "k." and comparison
 *   signs (ok. 80 km, tel. 792…, art. 6 ust. 1, ≥ 5,0, < 0,08);
 * - before a dash and a "×", which never start a line;
 * - inside a phone number (792 360 360), which must never break.
 * A postal code (09-320), an opening-hours range (7:00–17:00) and "e-mail"
 * are kept whole, as they would otherwise break at their hyphen or dash.
 * Only text between tags is touched; scripts, styles, SVG, form fields, the
 * title and select options are left alone.
 */
const NBSP = "\u00a0";
// A <title> and an <option> hold text alone, no markup.
const skip = /(<(script|style|svg|textarea|pre|title|option)\b[\s\S]*?<\/\2>)/gi;

const CALOSC = (t: string) => `<span class="whitespace-nowrap">${t}</span>`;

function typografia(text: string): string {
  return text
    .replace(/(?<=^|[\s(„])([aiouwzAIOUWZ])\s+(?=\S|$)/g, `$1${NBSP}`)
    .replace(/(?<=^|[\s(„])(do|od|we|ze|Do|Od|We|Ze)\s+(?=\p{Lu})/gu, `$1${NBSP}`)
    .replace(
      /(\d)\s+(zł|kg|km|t|mm|MJ|kWh|°C|r\.|palet|palety|paleta|worków|worki|worek|lat|lata)(?=[\s,.;:)!?/]|$)/g,
      `$1${NBSP}$2`,
    )
    .replace(/(\d\.)\s+(generacji)/g, `$1${NBSP}$2`)
    .replace(/(?<=^|[\s(])(ok\.|tel\.|nr|art\.|ust\.|lit\.|k\.|[≥≤±]|&lt;|&gt;)\s+(?=\S|$)/g, `$1${NBSP}`)
    .replace(/\s+([–×])\s/g, `${NBSP}$1 `)
    .replace(/\b(\d{3}) (\d{3}) (\d{3})\b/g, `$1${NBSP}$2${NBSP}$3`)
    .replace(/\b(\d{2}-\d{3}|\d{1,2}:\d{2}–\d{1,2}:\d{2}|e-mail\p{Ll}*)(?![\p{L}\d])/gu, (t) => CALOSC(t));
}

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  if (!response.headers.get("content-type")?.includes("text/html")) return response;
  const html = await response.text();
  const out = html
    .split(skip)
    .map((part, i) => {
      // split() with two capture groups yields [text, block, tagName, text, ...].
      if (i % 3 !== 0) return i % 3 === 1 ? part : "";
      return part.replace(/>([^<]+)</g, (_m, t: string) => `>${typografia(t)}<`);
    })
    .join("");
  return new Response(out, { status: response.status, headers: response.headers });
});
