import { defineMiddleware } from "astro:middleware";

/**
 * Polish typography on every HTML page: a non-breaking space after one-letter
 * words (w, z, i, a, o, u) so they never end a line, and between a number and
 * its unit (15 kg, 80 km, 2200 zł). Only text between tags is touched; scripts,
 * styles, SVG and form fields are left alone.
 */
const NBSP = " ";
const skip = /(<(script|style|svg|textarea|pre)\b[\s\S]*?<\/\2>)/gi;

function typografia(text: string): string {
  return text
    .replace(/(^|[\s(„])([aiouwzAIOUWZ]) (?=\S)/g, `$1$2${NBSP}`)
    .replace(/(\d) (zł|kg|km|t|°C|r\.)(?=[\s,.;:)!?/]|$)/g, `$1${NBSP}$2`);
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
