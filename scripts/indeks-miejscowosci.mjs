/**
 * The place index for the town search on the distribution map: every town
 * and village within the free delivery range, written to
 * src/data/indeks/<letter>.json, one file per first letter of the name as
 * the search folds it (`zloz`). The page loads only the file it needs.
 *
 * Run it again when the register has a new export you want, after moving
 * the warehouse, changing the range in ZASADA_DOSTAWY or adding a town to
 * miejsca.ts (the towns of that list are left out of the index):
 *   bun scripts/indeks-miejscowosci.mjs
 * Add --stats to also print the counts by kind and by name.
 *
 * The names come from PRNG, the state register of geographic names kept by
 * GUGiK, as the public GML export of all localities. The download (20 MB)
 * is kept in .cache/prng/ and used again on later runs; delete it to fetch
 * a fresh one. It never goes into the repo. The towns, the warehouse and
 * the range are read from the data files as text: those files need Astro
 * to import.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { zloz } from "../src/lib/zloz.ts";

const ZRODLO = "https://opendata.geoportal.gov.pl/prng/PRNG_MIEJSCOWOSCI_GML.zip";
const W_ARCHIWUM = "PRNG_MIEJSCOWOSCI_GML.xml";
const sciezka = (p) => new URL(`../${p}`, import.meta.url);
const plik = (p) => readFileSync(sciezka(p), "utf8");

const [, magLat, magLng] = plik("src/data/firma.ts").match(/geo: \{ lat: ([\d.]+), lng: ([\d.]+) \}/);
const magazyn = { lat: Number(magLat), lon: Number(magLng) };
const miejsca = [...plik("src/data/miejsca.ts").matchAll(/nazwa: "([^"]+)".*?geo: \{ lat: ([\d.]+), lng: ([\d.]+) \}/g)].map(
  ([, nazwa, lat, lng]) => ({ nazwa, zlozona: zloz(nazwa), lat: Number(lat), lon: Number(lng) }),
);

// The range is the one the site states, not the 80 km of the drive.
const zasada = plik("src/data/dostawa.ts").match(/ZASADA_DOSTAWY = "[^"]*w promieniu (\d+) km/);
if (!zasada) throw new Error("No range in km found in ZASADA_DOSTAWY.");
const zasiegKm = Number(zasada[1]);

/** The kinds of place the index keeps, best first: the order settles duplicates. */
const RODZAJE = ["miasto", "wieś", "osada", "kolonia", "przysiółek", "osada wsi", "kolonia wsi", "przysiółek wsi"];

/** How near a listed town a register entry of the same name must be to be that town. */
const TO_SAMO_KM = 2;

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

const ENCJE = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
/** The text of one field of a register entry, with XML entities turned back. */
function pole(wpis, nazwa) {
  const m = wpis.match(new RegExp(`<rng:${nazwa}[^>]*>([^<]*)<`));
  if (!m) throw new Error(`A register entry has no ${nazwa}.`);
  return m[1].replace(/&(amp|lt|gt|quot|apos);/g, (_, e) => ENCJE[e]).trim();
}

// The download, once. Written under another name first, so a broken
// connection does not leave half a file that later runs would trust.
mkdirSync(sciezka(".cache/prng/"), { recursive: true });
const archiwum = sciezka(".cache/prng/PRNG_MIEJSCOWOSCI_GML.zip");
if (!existsSync(archiwum)) {
  const odp = await fetch(ZRODLO);
  if (!odp.ok) throw new Error(`${ZRODLO}: ${odp.status}`);
  const tymczasowy = sciezka(".cache/prng/PRNG_MIEJSCOWOSCI_GML.zip.part");
  writeFileSync(tymczasowy, Buffer.from(await odp.arrayBuffer()));
  renameSync(tymczasowy, archiwum);
}

// The export is 300 MB of XML, so it is read as a stream straight from the
// archive, one entry (featureMember) at a time. Each entry has one name, one
// kind and one point; only those in range are kept.
const KONIEC_WPISU = "</gml:featureMember>";
const wZasiegu = [];
const unzip = spawn("unzip", ["-p", archiwum.pathname, W_ARCHIWUM], { stdio: ["ignore", "pipe", "inherit"] });
const zakonczony = new Promise((resolve, reject) => {
  unzip.on("error", reject);
  unzip.on("close", resolve);
});
unzip.stdout.setEncoding("utf8");
let bufor = "";
let wszystkich = 0;
for await (const kawalek of unzip.stdout) {
  bufor += kawalek;
  let od = 0;
  for (let po = bufor.indexOf(KONIEC_WPISU, od); po >= 0; po = bufor.indexOf(KONIEC_WPISU, od)) {
    const wpis = bufor.slice(od, po);
    od = po + KONIEC_WPISU.length;
    wszystkich++;
    const [lat, lon] = pole(wpis, "wspolrzedneGeograficzne").split(/\s+/).map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error(`Bad coordinates: ${pole(wpis, "nazwaGlowna")}`);
    if (kmMiedzy(magazyn, { lat, lon }) > zasiegKm) continue;
    const nazwa = pole(wpis, "nazwaGlowna");
    const zlozona = zloz(nazwa);
    if (!zlozona) throw new Error(`A name folds to nothing: "${nazwa}"`);
    wZasiegu.push({
      nazwa,
      zlozona,
      rodzaj: pole(wpis, "rodzajObiektu"),
      // The register writes "Szczytno-gmina wiejska"; the index wants "Szczytno".
      gmina: pole(wpis, "gmina").replace(/-gmina (miejska|miejsko-wiejska|wiejska)$/, ""),
      powiat: pole(wpis, "powiat"),
      lat,
      lon,
    });
  }
  bufor = bufor.slice(od);
}
const kod = await zakonczony;
if (kod !== 0) throw new Error(`unzip ended with code ${kod}.`);
if (wszystkich === 0) throw new Error(`No entries read from ${W_ARCHIWUM}.`);

// One entry per name, gmina and powiat: the best kind wins, and of two of
// the same kind the one the register lists first.
const wybrane = new Map();
for (const m of wZasiegu) {
  const waga = RODZAJE.indexOf(m.rodzaj);
  if (waga < 0) continue;
  const klucz = `${m.zlozona}|${m.gmina}|${m.powiat}`;
  const jest = wybrane.get(klucz);
  if (!jest || waga < RODZAJE.indexOf(jest.rodzaj)) wybrane.set(klucz, m);
}

// The towns of miejsca.ts are on the map already, so their register entry
// goes: the one close by whose name is the listed name or its leading words
// (the list says "Lidzbark Welski", the register "Lidzbark").
const bezWpisu = new Set(miejsca.map((m) => m.nazwa));
const wpisy = [...wybrane.values()].filter((w) => {
  const znane = miejsca.filter(
    (m) => (m.zlozona === w.zlozona || m.zlozona.startsWith(`${w.zlozona} `)) && kmMiedzy(m, w) <= TO_SAMO_KM,
  );
  for (const m of znane) bezWpisu.delete(m.nazwa);
  return znane.length === 0;
});
wpisy.sort((a, b) => porownaj(a.zlozona, b.zlozona) || porownaj(a.gmina, b.gmina) || porownaj(a.powiat, b.powiat));

// One file per first character of the folded name. Each file carries its
// own list of gminas, in the order its places first use them.
const pliki = new Map();
for (const w of wpisy) {
  const znak = w.zlozona[0];
  if (!pliki.has(znak)) pliki.set(znak, { gminy: [], numery: new Map(), miejsca: [] });
  const p = pliki.get(znak);
  const klucz = `${w.gmina}|${w.powiat}`;
  if (!p.numery.has(klucz)) {
    p.numery.set(klucz, p.gminy.length);
    p.gminy.push([w.gmina, w.powiat]);
  }
  p.miejsca.push([w.nazwa, p.numery.get(klucz), Math.round(w.lat * 1e4) / 1e4, Math.round(w.lon * 1e4) / 1e4]);
}

// Old files go first, so a letter that no longer has places leaves nothing.
const katalog = sciezka("src/data/indeks/");
mkdirSync(katalog, { recursive: true });
for (const stary of readdirSync(katalog)) if (stary.endsWith(".json")) unlinkSync(new URL(stary, katalog));
const rozmiary = [];
for (const [znak, { gminy, miejsca: lista }] of pliki) {
  const tekst = `${JSON.stringify({ gminy, miejsca: lista })}\n`;
  writeFileSync(new URL(`${znak}.json`, katalog), tekst);
  rozmiary.push({ znak, bajty: Buffer.byteLength(tekst), gzip: gzipSync(tekst).length });
}

if (process.argv.includes("--stats")) {
  const licz = (lista, klucz) => {
    const ile = new Map();
    for (const x of lista) ile.set(klucz(x), (ile.get(klucz(x)) ?? 0) + 1);
    return [...ile].sort((a, b) => b[1] - a[1] || porownaj(a[0], b[0]));
  };
  console.log(`Kinds within ${zasiegKm} km:`);
  for (const [rodzaj, ile] of licz(wZasiegu, (m) => m.rodzaj)) {
    console.log(`  ${RODZAJE.includes(rodzaj) ? "kept   " : "dropped"} ${String(ile).padStart(6)}  ${rodzaj}`);
  }
  const nazwy = licz(wpisy, (w) => w.zlozona);
  const raz = nazwy.filter(([, ile]) => ile === 1).length;
  const wiele = nazwy.filter(([, ile]) => ile > 6).length;
  console.log(`Names: ${nazwy.length} distinct; ${raz} once, ${nazwy.length - raz - wiele} 2 to 6 times, ${wiele} more than 6 times.`);
  console.log(`Most repeated: ${nazwy.slice(0, 15).map(([n, ile]) => `${n} ${ile}`).join(", ")}`);
  console.log("Files (bytes, gzip):");
  for (const r of rozmiary) console.log(`  ${r.znak}.json ${String(r.bajty).padStart(7)} ${String(r.gzip).padStart(6)}`);
}

const suma = (pole) => rozmiary.reduce((s, r) => s + r[pole], 0);
const najwiekszy = rozmiary.reduce((a, b) => (b.bajty > a.bajty ? b : a));
console.log(
  `${wpisy.length} places within ${zasiegKm} km in ${rozmiary.length} files: ${suma("bajty")} bytes, ${suma("gzip")} compressed. ` +
    `Biggest: ${najwiekszy.znak}.json, ${najwiekszy.bajty} bytes, ${najwiekszy.gzip} compressed.`,
);
if (bezWpisu.size > 0) console.log(`Listed towns with no register entry dropped: ${[...bezWpisu].join(", ")}`);
