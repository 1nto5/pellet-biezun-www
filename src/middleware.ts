import { defineMiddleware } from "astro:middleware";

/**
 * Polish typography on every HTML page, with non-breaking spaces:
 * - after one-letter words (w, z, i, a, o, u), so they never end a line,
 *   also where the source breaks the line after one or puts a link after it;
 * - between a number and its unit (15 kg, 80 km, 2200 zł, 6 mm, 18 MJ/kg);
 * - after "ok." and comparison signs before a number (ok. 80 km, ≥ 5,0);
 * - inside a phone number (792 360 360), which must never break.
 * Only text between tags is touched; scripts, styles, SVG and form fields
 * are left alone.
 */
const NBSP = "\u00a0";
const skip = /(<(script|style|svg|textarea|pre)\b[\s\S]*?<\/\2>)/gi;

function typografia(text: string): string {
  return text
    .replace(/(?<=^|[\s(„])([aiouwzAIOUWZ])\s+(?=\S|$)/g, `$1${NBSP}`)
    .replace(/(\d)\s+(zł|kg|km|t|mm|MJ|kWh|°C|r\.)(?=[\s,.;:)!?/]|$)/g, `$1${NBSP}$2`)
    .replace(/(?<=^|\s)(ok\.|[≥≤±])\s+(?=\d)/g, `$1${NBSP}`)
    .replace(/\b(\d{3}) (\d{3}) (\d{3})\b/g, `$1${NBSP}$2${NBSP}$3`);
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
