/**
 * Road distances from the warehouse to every town on the map, written to
 * src/data/drogi.json. The free delivery zone is counted by road, as a satnav
 * counts it, never in a straight line; the site itself shows no distances.
 *
 * Run it again after adding a town or moving the warehouse:
 *   bun scripts/odleglosci-drogowe.mjs
 *
 * The routes come from the public Valhalla server of the OpenStreetMap
 * community (valhalla1.openstreetmap.de): the fastest route by car, as a
 * satnav picks it. The towns and the warehouse are read from the data files
 * as text: those files need Astro to import.
 */
import { readFileSync, writeFileSync } from "node:fs";

const SERWER = "https://valhalla1.openstreetmap.de";
const plik = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const [, magLat, magLng] = plik("src/data/firma.ts").match(/geo: \{ lat: ([\d.]+), lng: ([\d.]+) \}/);
const magazyn = { lat: Number(magLat), lon: Number(magLng) };
const darmowaKm = Number(plik("src/data/dostawa.ts").match(/DARMOWA_DOSTAWA_KM = (\d+)/)[1]);
const miejsca = [...plik("src/data/miejsca.ts").matchAll(/nazwa: "([^"]+)".*?geo: \{ lat: ([\d.]+), lng: ([\d.]+) \}/g)].map(
  ([, nazwa, lat, lng]) => ({ nazwa, lat: Number(lat), lon: Number(lng) }),
);
if (new Set(miejsca.map((m) => m.nazwa)).size !== miejsca.length) throw new Error("Two towns share a name.");

const zapytaj = async (sciezka, cialo) => {
  const odp = await fetch(`${SERWER}/${sciezka}?json=${encodeURIComponent(JSON.stringify(cialo))}`);
  if (!odp.ok) throw new Error(`${sciezka}: ${odp.status} ${await odp.text()}`);
  return odp.json();
};

// One route per town: the server's matrix stops at 150 km, and some towns
// are further. A short pause between them, as the server is shared.
const km = {};
for (const { nazwa, lat, lon } of miejsca) {
  const { trip } = await zapytaj("route", { locations: [magazyn, { lat, lon }], costing: "auto", units: "kilometers" });
  km[nazwa] = Math.round(trip.summary.length);
  await new Promise((r) => setTimeout(r, 300));
}

const dane = {
  zrodlo: `Valhalla (${SERWER}), trasa samochodem, ${new Date().toISOString().slice(0, 10)}`,
  km,
};
writeFileSync(new URL("../src/data/drogi.json", import.meta.url), `${JSON.stringify(dane, null, 1)}\n`);
const wStrefie = Object.values(km).filter((k) => k <= darmowaKm).length;
console.log(`${Object.keys(km).length} towns, ${wStrefie} within ${darmowaKm} km by road.`);
