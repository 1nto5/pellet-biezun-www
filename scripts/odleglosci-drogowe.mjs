/**
 * Road distances from the warehouse to every town on the map, written to
 * src/data/drogi.json, with the towns each route passes. Distances are
 * counted by road, as a satnav counts them, never in a straight line.
 *
 * Run it again after adding a town or moving the warehouse:
 *   bun scripts/odleglosci-drogowe.mjs
 *
 * The routes come from the public Valhalla server of the OpenStreetMap
 * community (valhalla1.openstreetmap.de): the fastest route by car, as a
 * satnav picks it. The towns and the warehouse are read from the data files
 * as text: those files need Astro to import.
 *
 * The same run writes src/data/trasy.json: the shape of each road, for the
 * line the distribution map draws to a chosen town.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { linia, uprosc, zakoduj } from "./linie.mjs";

const SERWER = "https://valhalla1.openstreetmap.de";
const plik = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const [, magLat, magLng] = plik("src/data/firma.ts").match(/geo: \{ lat: ([\d.]+), lng: ([\d.]+) \}/);
const magazyn = { lat: Number(magLat), lon: Number(magLng) };
const darmowaKm = Number(plik("src/data/dostawa.ts").match(/DARMOWA_DOSTAWA_KM = (\d+)/)[1]);
const miejsca = [...plik("src/data/miejsca.ts").matchAll(/nazwa: "([^"]+)".*?geo: \{ lat: ([\d.]+), lng: ([\d.]+) \}/g)].map(
  ([, nazwa, lat, lng]) => ({ nazwa, lat: Number(lat), lon: Number(lng) }),
);
if (new Set(miejsca.map((m) => m.nazwa)).size !== miejsca.length) throw new Error("Two towns share a name.");

/** How near the road a town's centre must be to count as passed on the way. */
const PO_DRODZE_KM = 3;

/** Straight-line km between two points; exact enough over a few km. */
function kmMiedzy(a, b) {
  const y = (a.lat - b.lat) * 111.2;
  const x = (a.lon - b.lon) * 111.2 * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
  return Math.hypot(x, y);
}

/**
 * How far a point of a route may be from the drawn line, in metres. The map
 * shows a route at a zoom where 60 m is under a pixel; raise it (up to 150)
 * if trasy.json grows too heavy.
 */
const TOLERANCJA_M = 60;

const zapytaj = async (sciezka, cialo) => {
  const odp = await fetch(`${SERWER}/${sciezka}?json=${encodeURIComponent(JSON.stringify(cialo))}`);
  if (!odp.ok) throw new Error(`${sciezka}: ${odp.status} ${await odp.text()}`);
  return odp.json();
};

// One route per town: the server's matrix stops at 150 km, and some towns
// are further. A short pause between them, as the server is shared.
const km = {};
const trasy = {};
for (const { nazwa, lat, lon } of miejsca) {
  const { trip } = await zapytaj("route", { locations: [magazyn, { lat, lon }], costing: "auto", units: "kilometers" });
  km[nazwa] = Math.round(trip.summary.length);
  trasy[nazwa] = trip.legs.flatMap((leg) => linia(leg.shape));
  await new Promise((r) => setTimeout(r, 300));
}

// The other towns of the list that the route to a town passes, in the order
// of the drive: a town counts when its centre is within PO_DRODZE_KM of the
// road. The town pages name them ("po drodze").
const poDrodze = {};
for (const cel of miejsca) {
  const trasa = trasy[cel.nazwa];
  const mijane = [];
  for (const m of miejsca) {
    if (m.nazwa === cel.nazwa || kmMiedzy(m, cel) <= PO_DRODZE_KM) continue;
    let najblizej = Infinity;
    let gdzie = 0;
    trasa.forEach((punkt, i) => {
      const d = kmMiedzy(m, punkt);
      if (d < najblizej) [najblizej, gdzie] = [d, i];
    });
    if (najblizej <= PO_DRODZE_KM) mijane.push({ nazwa: m.nazwa, gdzie });
  }
  if (mijane.length > 0) poDrodze[cel.nazwa] = mijane.sort((a, b) => a.gdzie - b.gdzie).map((m) => m.nazwa);
}

const dane = {
  zrodlo: `Valhalla (${SERWER}), trasa samochodem, ${new Date().toISOString().slice(0, 10)}`,
  km,
  poDrodze,
};
writeFileSync(new URL("../src/data/drogi.json", import.meta.url), `${JSON.stringify(dane, null, 1)}\n`);

// The roads themselves, for the map: warehouse first, town last.
const trasyDane = {
  zrodlo: dane.zrodlo,
  trasy: Object.fromEntries(miejsca.map(({ nazwa }) => [nazwa, zakoduj(uprosc(trasy[nazwa], TOLERANCJA_M))])),
};
const trasyTekst = `${JSON.stringify(trasyDane)}\n`;
writeFileSync(new URL("../src/data/trasy.json", import.meta.url), trasyTekst);
console.log(`Routes at ${TOLERANCJA_M} m: ${trasyTekst.length} bytes, ${gzipSync(trasyTekst).length} compressed.`);

const wStrefie = Object.values(km).filter((k) => k <= darmowaKm).length;
console.log(`${Object.keys(km).length} towns, ${wStrefie} within ${darmowaKm} km by road.`);
