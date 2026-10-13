/**
 * One road from the warehouse to every gmina of the place index, written to
 * src/data/trasy-gmin/<letter>.json, one file per first letter of the gmina
 * name as the search folds it (`zloz`). The map draws this road when the
 * customer picks a village that is not on the list of towns, and only the
 * last stretch to the village as a straight line.
 *
 * Run it again after the index changes (scripts/indeks-miejscowosci.mjs):
 *   bun scripts/trasy-gmin.mjs
 * Add --stats to also list the gminas left out and the file sizes, or
 * --probe to stop after five requests and show what the server answers.
 *
 * The routes come from the public Valhalla server of the OpenStreetMap
 * community, asked the same way as in odleglosci-drogowe.mjs. That server
 * allows one request a second, so a full run takes about a quarter of an
 * hour. Every answer is kept in .cache/valhalla/ and used again, so a
 * second run, or a run after a crash, asks only for what is missing.
 * Delete that folder to fetch the roads afresh.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { zloz } from "../src/lib/zloz.ts";
import { linia, uprosc, zakoduj } from "./linie.mjs";

const SERWER = "https://valhalla1.openstreetmap.de";
const PRZEDSTAW_SIE = "pellet-biezun-www build script (pelletbiezun.pl)";
const sciezka = (p) => new URL(`../${p}`, import.meta.url);
const plik = (p) => readFileSync(sciezka(p), "utf8");

const [, magLat, magLng] = plik("src/data/firma.ts").match(/geo: \{ lat: ([\d.]+), lng: ([\d.]+) \}/);
const magazyn = { lat: Number(magLat), lon: Number(magLng) };
const miejsca = [...plik("src/data/miejsca.ts").matchAll(/nazwa: "([^"]+)".*?geo: \{ lat: ([\d.]+), lng: ([\d.]+) \}/g)].map(
  ([, nazwa, lat, lng]) => ({ nazwa, zlozona: zloz(nazwa), lat: Number(lat), lon: Number(lng) }),
);

/** The same as in odleglosci-drogowe.mjs, so both sets of roads look alike. */
const TOLERANCJA_M = 60;

/**
 * A gmina named after a listed town that lies this near its middle has that
 * town as its seat. The road there is in trasy.json already.
 */
const SIEDZIBA_KM = 15;

/** The server's rule: one request a second. */
const ODSTEP_MS = 1000;

/** How long to wait before each new try when the server is busy or down. */
const PONOWIENIA_S = [5, 15, 60];

/** Straight-line km between two points on the globe (haversine). */
function kmMiedzy(a, b) {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lon - a.lon) * rad) / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.sqrt(h));
}

/** Order by code point, the same on every machine, unlike localeCompare. */
const porownaj = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// The gminas and their places, from the index files.
const gminy = new Map();
const indeks = sciezka("src/data/indeks/");
for (const nazwaPliku of readdirSync(indeks).filter((n) => n.endsWith(".json")).sort()) {
  const dane = JSON.parse(readFileSync(new URL(nazwaPliku, indeks), "utf8"));
  for (const [nazwa, numer, lat, lon] of dane.miejsca) {
    const [gmina, powiat] = dane.gminy[numer];
    const klucz = `${gmina}|${powiat}`;
    if (!gminy.has(klucz)) gminy.set(klucz, { klucz, gmina, powiat, miejsca: [] });
    gminy.get(klucz).miejsca.push({ nazwa, zlozona: zloz(nazwa), lat, lon });
  }
}
if (gminy.size === 0) throw new Error("The index is empty: run scripts/indeks-miejscowosci.mjs first.");

// Where the road to a gmina ends: at the place the gmina is named after, or,
// when the index has no such place, at the one nearest the middle of the
// gmina's places.
const cele = [];
const pominiete = [];
const zeSrodka = [];
for (const g of [...gminy.values()].sort((a, b) => porownaj(a.klucz, b.klucz))) {
  const zlozona = zloz(g.gmina);
  const srodek = {
    lat: g.miejsca.reduce((s, m) => s + m.lat, 0) / g.miejsca.length,
    lon: g.miejsca.reduce((s, m) => s + m.lon, 0) / g.miejsca.length,
  };
  if (miejsca.some((m) => m.zlozona === zlozona && kmMiedzy(m, srodek) <= SIEDZIBA_KM)) {
    pominiete.push(g.klucz);
    continue;
  }
  let cel = g.miejsca.find((m) => m.zlozona === zlozona);
  if (!cel) {
    // Sorted first, so two places equally near always give the same one.
    const kolejno = [...g.miejsca].sort((a, b) => porownaj(a.zlozona, b.zlozona) || a.lat - b.lat || a.lon - b.lon);
    cel = kolejno.reduce((a, b) => (kmMiedzy(b, srodek) < kmMiedzy(a, srodek) ? b : a));
    zeSrodka.push(`${g.klucz} -> ${cel.nazwa}`);
  }
  cele.push({ klucz: g.klucz, gmina: g.gmina, lat: cel.lat, lon: cel.lon });
}

const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));
const proba = process.argv.includes("--probe");
let wyslane = 0;
let odmowy429 = 0;
let inneBledy = 0;
let ostatnie = 0;

/**
 * The route to one point, as the server's own text, or nothing when it
 * cannot be had. One request at a time and no more than one a second. A
 * busy server (429) or a broken one (5xx) gets three more tries.
 */
async function zapytaj(cel) {
  const cialo = { locations: [magazyn, { lat: cel.lat, lon: cel.lon }], costing: "auto", units: "kilometers" };
  const adres = `${SERWER}/route?json=${encodeURIComponent(JSON.stringify(cialo))}`;
  for (let nr = 0; ; nr++) {
    await czekaj(Math.max(0, ostatnie + ODSTEP_MS - Date.now()));
    ostatnie = Date.now();
    wyslane++;
    let odp;
    let tekst = "";
    try {
      odp = await fetch(adres, { headers: { "User-Agent": PRZEDSTAW_SIE } });
      tekst = await odp.text();
    } catch (blad) {
      odp = { status: 0, ok: false, headers: new Headers() };
      tekst = String(blad);
    }
    if (proba) console.log(cel.klucz, odp.status, Object.fromEntries(odp.headers));
    if (odp.ok) {
      if (trasaZ(tekst)) return tekst;
      inneBledy++;
      console.log(`${cel.klucz}: an answer with no route.`);
      return null;
    }
    if (odp.status === 429) odmowy429++;
    else inneBledy++;
    const ponow = odp.status === 429 || odp.status >= 500 || odp.status === 0;
    if (!ponow || nr >= PONOWIENIA_S.length) {
      console.log(`${cel.klucz}: ${odp.status} ${tekst.slice(0, 200)}`);
      return null;
    }
    const prosba = Number(odp.headers.get("retry-after"));
    await czekaj((prosba > 0 ? prosba : PONOWIENIA_S[nr]) * 1000);
  }
}

/** The points of the route in a server answer, or nothing if it has none. */
function trasaZ(tekst) {
  try {
    const { trip } = JSON.parse(tekst);
    return trip.legs.flatMap((leg) => linia(leg.shape));
  } catch {
    return null;
  }
}

/**
 * An answer kept from an earlier run counts only if it was for the same
 * point: after the index changes, the place a road ends at may move.
 */
function zZapasu(adresPliku, cel) {
  if (!existsSync(adresPliku)) return null;
  const tekst = readFileSync(adresPliku, "utf8");
  try {
    const dokad = JSON.parse(tekst).trip.locations.at(-1);
    if (Math.abs(dokad.lat - cel.lat) > 1e-6 || Math.abs(dokad.lon - cel.lon) > 1e-6) return null;
  } catch {
    return null;
  }
  return tekst;
}

const zapas = sciezka(".cache/valhalla/");
mkdirSync(zapas, { recursive: true });
const trasy = new Map();
const nieudane = [];
let nowych = 0;
for (const cel of cele) {
  const adresPliku = new URL(`${encodeURIComponent(cel.klucz)}.json`, zapas);
  let tekst = zZapasu(adresPliku, cel);
  if (!tekst) {
    if (proba && nowych >= 5) break;
    nowych++;
    tekst = await zapytaj(cel);
    if (!tekst) {
      nieudane.push(cel.klucz);
      continue;
    }
    // Under another name first, so a crash does not leave half an answer.
    const tymczasowy = new URL(`${encodeURIComponent(cel.klucz)}.part`, zapas);
    writeFileSync(tymczasowy, tekst);
    renameSync(tymczasowy, adresPliku);
  }
  trasy.set(cel.klucz, zakoduj(uprosc(trasaZ(tekst), TOLERANCJA_M)));
}
if (proba) {
  console.log("Probe only: no files written.");
  process.exit(0);
}

// One file per first character of the folded gmina name, keys in order.
// Old files go first, so a letter that no longer has gminas leaves nothing.
const katalog = sciezka("src/data/trasy-gmin/");
mkdirSync(katalog, { recursive: true });
for (const stary of readdirSync(katalog)) if (stary.endsWith(".json")) unlinkSync(new URL(stary, katalog));
const pliki = new Map();
for (const cel of cele) {
  if (!trasy.has(cel.klucz)) continue;
  const znak = zloz(cel.gmina)[0];
  if (!pliki.has(znak)) pliki.set(znak, {});
  pliki.get(znak)[cel.klucz] = trasy.get(cel.klucz);
}
const rozmiary = [];
for (const [znak, drogi] of pliki) {
  const tekst = `${JSON.stringify(drogi)}\n`;
  writeFileSync(new URL(`${znak}.json`, katalog), tekst);
  rozmiary.push({ znak, bajty: Buffer.byteLength(tekst), gzip: gzipSync(tekst).length });
}

if (process.argv.includes("--stats")) {
  console.log(`Gminas with a listed town as the seat, left out (${pominiete.length}): ${pominiete.join(", ")}`);
  console.log(`Gminas with no place of their own name, road to the place nearest the middle (${zeSrodka.length}):`);
  for (const z of zeSrodka) console.log(`  ${z}`);
  console.log("Files (bytes, gzip):");
  for (const r of rozmiary) console.log(`  ${r.znak}.json ${String(r.bajty).padStart(7)} ${String(r.gzip).padStart(6)}`);
}

const suma = (pole) => rozmiary.reduce((s, r) => s + r[pole], 0);
const najwiekszy = rozmiary.reduce((a, b) => (b.bajty > a.bajty ? b : a));
console.log(
  `${trasy.size} roads for ${gminy.size} gminas (${pominiete.length} have a listed town as the seat) in ${rozmiary.length} files: ` +
    `${suma("bajty")} bytes, ${suma("gzip")} compressed. Biggest: ${najwiekszy.znak}.json, ${najwiekszy.bajty} bytes, ${najwiekszy.gzip} compressed.`,
);
console.log(`Requests sent: ${wyslane}; refused as too many (429): ${odmowy429}; other failures: ${inneBledy}.`);
if (nieudane.length > 0) console.log(`No road for: ${nieudane.join(", ")}`);
