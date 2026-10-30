/**
 * Tells Bing (and the other IndexNow engines: Yandex, Seznam, Naver) which
 * addresses on pelletbiezun.pl are new or changed, so they crawl them
 * without waiting for the sitemap. Run after a deploy has gone live:
 *
 *   bun run indexnow                      every address in the sitemap
 *   bun run indexnow /oferta/ /faq/       only these
 *
 * The key is the name of the one `<32 hex>.txt` file in public/. It is not a
 * secret: IndexNow checks it by reading that file from the site, so anyone
 * can see it. https://www.indexnow.org/documentation
 */
import { readdirSync } from "node:fs";

const strona = "https://pelletbiezun.pl/";

const pliki = readdirSync(new URL("../public/", import.meta.url)).filter((p) =>
  /^[0-9a-f]{32}\.txt$/.test(p),
);
if (pliki.length !== 1) {
  throw new Error(`public/ ma ${pliki.length} plików z kluczem IndexNow, a powinien mieć 1`);
}
const klucz = pliki[0].slice(0, -4);
const plikKlucza = new URL(pliki[0], strona).href;

// IndexNow rejects the whole list when the key file is not live yet.
const naStronie = await fetch(plikKlucza).then((r) => (r.ok ? r.text() : ""));
if (naStronie.trim() !== klucz) {
  throw new Error(`${plikKlucza} nie zwraca klucza: wdrożenie jeszcze nie weszło?`);
}

async function zMapy() {
  const xml = await fetch(new URL("sitemap-0.xml", strona)).then((r) => r.text());
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

const adresy = process.argv.length > 2
  ? process.argv.slice(2).map((a) => new URL(a, strona).href)
  : await zMapy();

const odpowiedz = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: new URL(strona).host,
    key: klucz,
    keyLocation: plikKlucza,
    urlList: adresy,
  }),
});

// 200 and 202 both mean accepted; 202 while the key is still being checked.
console.log(`${odpowiedz.status} ${odpowiedz.statusText}: ${adresy.length} adresów`);
if (!odpowiedz.ok) {
  console.log(await odpowiedz.text());
  process.exit(1);
}
