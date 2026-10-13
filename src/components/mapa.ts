/**
 * Draws a map for Mapa.astro with Leaflet and OpenStreetMap tiles. Loaded on
 * demand, with Leaflet's own stylesheet, when a map comes near the screen:
 * a page whose map is never seen never pays for Leaflet.
 */
import L from "leaflet";
import leafletCss from "leaflet/dist/leaflet.css?url";
import { zloz } from "../lib/zloz";

/**
 * Leaflet's stylesheet, added to the page once, with the first map: imported
 * the usual way it would be linked, render-blocking, on every page with a map.
 */
let arkusz: Promise<void> | undefined;
function wczytajArkusz(): Promise<void> {
  arkusz ??= new Promise((gotowe) => {
    const link = Object.assign(document.createElement("link"), { rel: "stylesheet", href: leafletCss });
    link.addEventListener("load", () => gotowe(), { once: true });
    link.addEventListener("error", () => gotowe(), { once: true });
    document.head.append(link);
  });
  return arkusz;
}

/** What Mapa.astro hands over in `data-mapa`. */
export interface DaneMapy {
  magazyn: { nazwa: string; adres: string; tel: string; telHref: string; lat: number; lng: number };
  miejsca: {
    /** The town's bare name: unique, the key in trasy.json and in the events. */
    klucz: string;
    /** The name as shown, note included: "Nowe Miasto k. Płońska". */
    nazwa: string;
    lat: number;
    lng: number;
    href: string | null;
    wyroznione: boolean;
  }[];
  /** The order page; a town's popup links to it with the town filled in. */
  zamow: string;
}

type MiejsceMapy = DaneMapy["miejsca"][number];
/** A town and its dot. */
interface Kropka {
  m: MiejsceMapy;
  kropka: L.CircleMarker;
  /**
   * Set for a place found by the page's search that has no dot of its own:
   * its bare name, for the order link, and its gmina, for the road. Such a
   * dot is on the map only while it is the chosen one.
   */
  wlasna?: string;
  gmina?: string;
}

/**
 * A place without a dot, sent by the page with `mapa:wybierz`: `klucz` is a
 * key the page makes up, `nazwa` what the popup says, `wlasna` the bare name.
 */
export interface PunktMapy {
  klucz: string;
  nazwa: string;
  wlasna: string;
  /** The place's gmina, as the index has it: it says which file of roads to search. */
  gmina: string;
  lat: number;
  lng: number;
}
/** What the page sends with `mapa:wybierz`: a town's key, a place without a dot, or neither. */
export interface WyborMapy {
  klucz: string | null;
  punkt?: PunktMapy | undefined;
}

/** How near a dot the pointer must be to mean its town, in px: a mouse, a finger. */
const ZASIEG_MYSZ = 14;
const ZASIEG_PALEC = 24;
/** Dot sizes, in px: a town, and the chosen one or a town page's own. */
const PROMIEN = 6;
const PROMIEN_DUZY = 9;
/** How long the road takes to draw itself, in ms. */
const RYSOWANIE_MS = 800;
/** A straight line from the road to a searched place is drawn from this length up, in m. */
const DOJAZD_OD_M = 200;
/**
 * And up to this length, in km: past it no stored road goes near the place,
 * and the map shows the place without a road. Only compared, never shown.
 */
const DOJAZD_MAKS_KM = 25;

// Popups are built from DOM nodes, not an HTML string, so a name with an
// odd character cannot break the markup.
function popup(...lines: (string | Node)[]): HTMLElement {
  const box = document.createElement("div");
  lines.forEach((line, i) => {
    if (i > 0) box.append(document.createElement("br"));
    box.append(line);
  });
  return box;
}
function strong(text: string): HTMLElement {
  const el = document.createElement("strong");
  el.textContent = text;
  return el;
}
function link(href: string, text: string, className = ""): HTMLAnchorElement {
  const a = document.createElement("a");
  a.href = href;
  a.textContent = text;
  a.className = className;
  return a;
}

/**
 * The roads to the towns (trasy.json, about 12 KB compressed), fetched when
 * the first town is chosen: most readers only look at the map. A browser
 * does not fetch a failed module again, so after a failure the map stays
 * without roads until the page is reloaded; towns are still chosen and shown.
 */
let trasy: Promise<Record<string, string>> | undefined;
function wczytajTrasy(): Promise<Record<string, string>> {
  trasy ??= import("../data/trasy.json").then((plik) => plik.default.trasy as Record<string, string>);
  return trasy;
}

/** A road from trasy.json: an encoded polyline with five decimal places. */
function dekoduj(tekst: string): L.LatLngTuple[] {
  const punkty: L.LatLngTuple[] = [];
  let i = 0;
  let lat = 0;
  let lng = 0;
  const liczba = () => {
    let wynik = 0;
    let przesuniecie = 0;
    let bajt: number;
    do {
      bajt = tekst.charCodeAt(i++) - 63;
      wynik |= (bajt & 0x1f) << przesuniecie;
      przesuniecie += 5;
    } while (bajt >= 0x20);
    return wynik & 1 ? ~(wynik >> 1) : wynik >> 1;
  };
  while (i < tekst.length) {
    lat += liczba();
    lng += liczba();
    punkty.push([lat / 1e5, lng / 1e5]);
  }
  return punkty;
}

/** The roads to the 92 towns as points, decoded once, for places without a dot. */
let drogi: Promise<L.LatLngTuple[][]> | undefined;
/**
 * One more road for each gmina that has none among the towns'
 * (src/data/trasy-gmin), in a file for each first letter of the gmina's
 * folded name, fetched when a place of such a gmina is chosen. The whole
 * file is searched, so the road taken may be another gmina's. A file that is
 * missing or fails to load counts as empty: the roads to the towns are
 * searched alone.
 */
const plikiGmin = import.meta.glob<Record<string, string>>("../data/trasy-gmin/*.json", { import: "default" });
const drogiGmin = new Map<string, Promise<L.LatLngTuple[][]>>();
function wczytajDrogiGmin(gmina: string): Promise<L.LatLngTuple[][]> {
  const znak = zloz(gmina)[0] ?? "";
  let wczytane = drogiGmin.get(znak);
  if (!wczytane) {
    const plik = plikiGmin[`../data/trasy-gmin/${znak}.json`];
    wczytane = plik ? plik().then((kody) => Object.values(kody).map(dekoduj)).catch(() => []) : Promise.resolve([]);
    drogiGmin.set(znak, wczytane);
  }
  return wczytane;
}

/** What is drawn for a chosen place: the road, and the straight line on from its end. */
interface Droga {
  punkty?: L.LatLngTuple[] | undefined;
  dojazd?: L.LatLngTuple[] | undefined;
}
/**
 * The way to a place that has no road of its own: of the roads to the towns
 * and those of its gmina's file, the one that passes nearest the place, from
 * the warehouse up to the point of the road nearest the place (anywhere on
 * its line, not only at a vertex), and the straight line from there to the
 * place. The line is left out under `DOJAZD_OD_M`; when it would be longer
 * than `DOJAZD_MAKS_KM`, nothing is drawn.
 */
async function drogaDoPunktu(gmina: string, cel: L.LatLng): Promise<Droga> {
  drogi ??= wczytajTrasy().then((kody) => Object.values(kody).map(dekoduj));
  const [doMiast, doGmin] = await Promise.all([drogi, wczytajDrogiGmin(gmina)]);
  // Near enough to flat at this scale: degrees of longitude are shortened
  // by the latitude, and the squares compare without a root.
  const skala = Math.cos((cel.lat * Math.PI) / 180);
  const [cy, cx] = [cel.lat, cel.lng * skala];
  let najblizej = Infinity;
  let droga: L.LatLngTuple[] | undefined;
  // The segment that starts at vertex `odcinek`, and how far along it (0 to 1).
  let odcinek = 0;
  let ulamek = 0;
  for (const punkty of [...doMiast, ...doGmin]) {
    for (let i = 0; i + 1 < punkty.length; i++) {
      const [ay, ax] = [punkty[i]![0], punkty[i]![1] * skala];
      const [dy, dx] = [punkty[i + 1]![0] - ay, punkty[i + 1]![1] * skala - ax];
      const dlugosc = dy * dy + dx * dx;
      // The place dropped onto the segment, kept between its two ends.
      const t = dlugosc > 0 ? Math.min(1, Math.max(0, ((cy - ay) * dy + (cx - ax) * dx) / dlugosc)) : 0;
      const d = (ay + t * dy - cy) ** 2 + (ax + t * dx - cx) ** 2;
      if (d < najblizej) [najblizej, droga, odcinek, ulamek] = [d, punkty, i, t];
    }
  }
  const [od, ku] = [droga?.[odcinek], droga?.[odcinek + 1]];
  if (!droga || !od || !ku) return {};
  const zjazd: L.LatLngTuple = [od[0] + ulamek * (ku[0] - od[0]), od[1] + ulamek * (ku[1] - od[1])];
  const prosto = cel.distanceTo(zjazd);
  if (prosto > DOJAZD_MAKS_KM * 1000) return {};
  return {
    // The nearest point may be the warehouse itself: no road then, only the line.
    punkty: odcinek > 0 || ulamek > 0 ? [...droga.slice(0, odcinek + 1), zjazd] : undefined,
    dojazd: prosto >= DOJAZD_OD_M ? [zjazd, [cel.lat, cel.lng]] : undefined,
  };
}

/** Draws the map into `el`, from its `data-mapa`, `data-zoom` and `data-trasy`. */
export async function narysujMape(el: HTMLElement): Promise<void> {
  await wczytajArkusz();
  const dane: DaneMapy = JSON.parse(el.dataset.mapa ?? "{}");
  const { magazyn } = dane;
  const zTrasami = "trasy" in el.dataset;
  const bezRuchu = window.matchMedia("(prefers-reduced-motion: reduce)");
  const palec = window.matchMedia("(pointer: coarse)");

  // A page scrolling past the map must not get caught by it: no
  // scroll-wheel zoom until the reader has clicked or dragged the map, and
  // none again once the pointer has left it. On a touch screen one finger
  // scrolls the page instead of dragging the map. The +/- buttons zoom, and
  // two fingers still move and zoom the map.
  // Zoom in quarter steps lets the towns fill the frame; with whole steps
  // they sat in a small patch in the middle. The buttons still go a whole step.
  // Leaflet would close an open popup before every click on the map; the
  // click handler below does it, so a click from one town's dot to another's
  // is one change of town, not "none" and then the other.
  const map = L.map(el, { scrollWheelZoom: false, dragging: !L.Browser.mobile, zoomControl: false, zoomSnap: 0.25, closePopupOnClick: false });
  map.on("click dragstart", () => map.scrollWheelZoom.enable());
  el.addEventListener("mouseleave", () => map.scrollWheelZoom.disable());
  // Leaflet names its buttons and its own credit link in English; the page
  // is Polish.
  L.control.zoom({ zoomInTitle: "Przybliż", zoomOutTitle: "Oddal" }).addTo(map);
  const prefix = map.attributionControl.options.prefix;
  if (typeof prefix === "string") {
    map.attributionControl.setPrefix(prefix.replace(/title="[^"]*"/, 'title="Biblioteka do map interaktywnych"'));
  }
  map.on("popupopen", (e) => e.popup.getElement()?.querySelector(".leaflet-popup-close-button")?.setAttribute("aria-label", "Zamknij"));
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const naMagazynie: L.LatLngTuple = [magazyn.lat, magazyn.lng];
  const bounds = L.latLngBounds([naMagazynie]);

  // The dots do not take the pointer themselves: where towns are dense the
  // top dot would cover its neighbours. The map finds the nearest one instead
  // (`najblizsza`, below).
  const promien = (m: MiejsceMapy) => (m.wyroznione ? PROMIEN_DUZY : PROMIEN);
  const kropki: Kropka[] = dane.miejsca.map((m) => {
    const kropka = L.circleMarker([m.lat, m.lng], {
      radius: promien(m),
      interactive: false,
      className: [
        "mapa-miejsce",
        m.wyroznione ? "mapa-miejsce-wyroznione" : "",
      ].join(" "),
    }).addTo(map);
    bounds.extend([m.lat, m.lng]);
    return { m, kropka };
  });

  // The warehouse last, so its pin is above every dot. The pin is a square
  // of 1.7rem (`.pin` in global.css, which must match) turned by -45deg: the
  // tip of its sharp corner, black edge included, is on the warehouse, and
  // the popup opens a little above its round top.
  const bok = 1.7 * parseFloat(getComputedStyle(document.documentElement).fontSize);
  const czubek = bok / 2 + bok / Math.SQRT2 + 2 * Math.SQRT2;
  const icon = L.divIcon({
    className: "",
    html: '<div class="pin"></div>',
    iconSize: [bok, bok],
    iconAnchor: [bok / 2, czubek],
    popupAnchor: [0, -czubek - 10],
  });
  L.marker(naMagazynie, { icon, title: `Magazyn ${magazyn.nazwa}`, alt: `Magazyn ${magazyn.nazwa}` })
    .addTo(map)
    .bindPopup(popup(strong(`Magazyn ${magazyn.nazwa}`), magazyn.adres, link(magazyn.telHref, `tel.\u00a0${magazyn.tel.replace(/ /g, "\u00a0")}`)));

  /** The view the map opens with: everything drawn, or the warehouse alone. */
  const calyWidok = (plynnie: boolean) => {
    if (dane.miejsca.length === 0) map.setView(naMagazynie, Number(el.dataset.zoom));
    else if (plynnie) map.flyToBounds(bounds, { padding: [24, 24], duration: 0.8 });
    else map.fitBounds(bounds, { padding: [24, 24], animate: false });
  };
  calyWidok(false);
  /**
   * True while the map still shows, or shows again, the view it opened with.
   * Counted as `fitBounds` counts it, for the map's size now: the zoom that
   * fits, and the middle of the area as drawn (not of its coordinates, which
   * lies a few pixels north).
   */
  const wCalymWidoku = () => {
    const zoom = map.getBoundsZoom(bounds, false, L.point(48, 48));
    const srodek = map.unproject(map.project(bounds.getSouthWest(), zoom).add(map.project(bounds.getNorthEast(), zoom)).divideBy(2), zoom);
    return Math.abs(map.getZoom() - zoom) < 0.05 && map.latLngToContainerPoint(srodek).distanceTo(map.getSize().divideBy(2)) < 2;
  };
  // Leaflet draws the dots, once the map has its view, in one SVG, which a
  // screen reader would announce as an image without a name; the list under
  // the map names the same towns.
  map.getPanes().overlayPane.querySelector("svg")?.setAttribute("aria-hidden", "true");

  // The town under the pointer: its dot lights up and a small sign above it
  // says its name. One sign for the whole map, moved from dot to dot; its
  // text is a text node, never markup.
  const napis = document.createElement("span");
  const tabliczka = L.tooltip({ direction: "top", offset: [0, -6], opacity: 1, className: "mapa-nazwa" }).setContent(napis);
  let wskazana: Kropka | undefined;
  let wybrana: Kropka | undefined;
  let dymek: L.Popup | undefined;

  /** The town whose dot is nearest the point, if any is near enough. */
  function najblizsza(punkt: L.Point, dotyk: boolean): Kropka | undefined {
    let najblizej = dotyk ? ZASIEG_PALEC : ZASIEG_MYSZ;
    let znaleziona: Kropka | undefined;
    // A searched place's dot is the chosen one, on top of the others: last,
    // so it wins a tie.
    for (const k of wybrana?.wlasna === undefined ? kropki : [...kropki, wybrana]) {
      const d = map.latLngToContainerPoint(k.kropka.getLatLng()).distanceTo(punkt);
      if (d <= najblizej) [najblizej, znaleziona] = [d, k];
    }
    return znaleziona;
  }

  function wskaz(k: Kropka | undefined): void {
    if (k === wskazana) return;
    wskazana?.kropka.getElement()?.classList.remove("is-wskazana");
    wskazana = k;
    el.classList.toggle("mapa-nad-miejscem", k !== undefined);
    map.closeTooltip(tabliczka);
    if (!k) return;
    k.kropka.getElement()?.classList.add("is-wskazana");
    k.kropka.bringToFront();
    wybrana?.kropka.bringToFront();
    // The chosen town's name is already in its popup.
    if (k === wybrana) return;
    napis.textContent = k.m.nazwa;
    // Above the dot, unless the map's edge would cut the sign there: beside
    // the dot near the left and right edges, under it near the top.
    const { x, y } = map.latLngToContainerPoint(k.kropka.getLatLng());
    const [strona, odstep]: [L.Direction, L.PointTuple] =
      x < 110 ? ["right", [8, 0]] : x > map.getSize().x - 110 ? ["left", [-8, 0]] : y < 56 ? ["bottom", [0, 6]] : ["top", [0, -6]];
    tabliczka.options.direction = strona;
    tabliczka.options.offset = odstep;
    map.openTooltip(tabliczka.setLatLng(k.kropka.getLatLng()));
  }

  /** What a town's popup says: its name, the way to order, its own page if it has one. */
  function trescDymka({ m, wlasna = m.klucz }: Kropka): HTMLElement {
    const box = document.createElement("div");
    box.className = "mapa-dymek";
    const linki = document.createElement("p");
    linki.append(link(`${dane.zamow}?miejscowosc=${encodeURIComponent(wlasna)}`, "Zamów dostawę", "btn btn-primary btn-sm"));
    if (m.href) linki.append(link(m.href, "Dostawa i ceny", "link-strong"));
    box.append(strong(m.nazwa), linki);
    return box;
  }

  // The road to the chosen town, drawn under the dots as the site draws a
  // road everywhere: asphalt with a white edge and a dashed white centre line.
  let trasa: L.LayerGroup | undefined;
  if (zTrasami) map.createPane("trasa").style.zIndex = "350";
  // True from the start of a flight to a town's road, or back to the whole
  // area, until the map has landed.
  let wLocie = false;
  map.on("moveend", () => {
    wLocie = false;
  });

  function usunTrase(): void {
    trasa?.remove();
    trasa = undefined;
  }

  /**
   * `dojazd`: the straight line from the road's end to a place that has no
   * road of its own, dashed. It comes when the road has drawn itself.
   */
  function rysujTrase(punkty: L.LatLngTuple[] = [], dojazd?: L.LatLngTuple[]): void {
    const linia = (wierzcholki: L.LatLngTuple[], className: string) =>
      L.polyline(wierzcholki, { pane: "trasa", interactive: false, className: `mapa-trasa ${className}` });
    const [obrys, jezdnia, os] = ["mapa-trasa-obrys", "mapa-trasa-jezdnia", "mapa-trasa-os"].map((className) => linia(punkty, className)) as [
      L.Polyline,
      L.Polyline,
      L.Polyline,
    ];
    const prosta = dojazd && linia(dojazd, "mapa-trasa-dojazd");
    trasa = L.layerGroup(prosta ? [obrys, jezdnia, os, prosta] : [obrys, jezdnia, os]).addTo(map);
    // This pane has an SVG of its own; see the dots' SVG above.
    map.getPane("trasa")?.querySelector("svg")?.setAttribute("aria-hidden", "true");
    if (bezRuchu.matches) return;
    // Hidden while the road draws itself, then it fades in; at once when
    // there is no road before it.
    if (punkty.length > 0) prosta?.getElement()?.animate?.([{ opacity: 0 }, { opacity: 0, offset: 0.8 }, { opacity: 1 }], { duration: RYSOWANIE_MS / 0.8 });
    // The road draws itself from the warehouse: with the path's length
    // counted as 1, one dash of 1 slides in from its start. The centre line
    // is dashed already, so it fades in once the asphalt is laid.
    for (const linia of [obrys, jezdnia]) {
      const path = linia.getElement();
      path?.setAttribute("pathLength", "1");
      path?.animate?.(
        [
          { strokeDasharray: "1", strokeDashoffset: "1" },
          { strokeDasharray: "1", strokeDashoffset: "0" },
        ],
        { duration: RYSOWANIE_MS, easing: "ease-out" },
      );
    }
    os.getElement()?.animate?.([{ opacity: 0 }, { opacity: 0, offset: 0.8 }, { opacity: 1 }], { duration: RYSOWANIE_MS / 0.8 });
  }

  /**
   * Fetches and draws the road to the chosen town. `lec`: the town was picked
   * outside the map, so the map goes to the whole road first and draws it
   * once there.
   */
  async function pokazTrase(k: Kropka, lec: boolean): Promise<void> {
    // Without the road (a failed fetch) the town is still chosen and shown.
    // A town has its own road; a searched place borrows the nearest one.
    const szukana: Promise<Droga> =
      k.wlasna !== undefined
        ? drogaDoPunktu(k.gmina ?? "", k.kropka.getLatLng())
        : wczytajTrasy().then((kody) => {
            const kod = kody[k.m.klucz];
            return { punkty: kod ? dekoduj(kod) : undefined };
          });
    const { punkty, dojazd } = await szukana.catch((): Droga => ({}));
    // The reader may have picked another town, or none, while this one loaded.
    const aktualna = () => wybrana === k;
    if (!aktualna()) return;
    const rysuj = () => {
      if (!aktualna()) return;
      if ((punkty || dojazd) && !trasa) rysujTrase(punkty, dojazd);
      // Should the popup still stand across the map's edge, Leaflet moves
      // the map by what is missing, as it does when a popup opens.
      if (lec && dymek) {
        dymek.options.autoPan = true;
        dymek.update();
      }
    };
    if (!lec) return rysuj();
    // Room for the popup, which stands above the town's dot and is wider
    // than it: a town at the edge of the road's frame would have its popup
    // cut by the map's edge. Less on a phone's narrow map.
    // A searched place lies off the road it borrows, so it is counted in.
    const zasieg = L.latLngBounds(punkty ?? [k.kropka.getLatLng()]).extend(naMagazynie);
    if (k.wlasna !== undefined) zasieg.extend(k.kropka.getLatLng());
    const bok = Math.min(120, map.getSize().x * 0.3);
    const ramka = { paddingTopLeft: [bok, 170], paddingBottomRight: [bok, 40], maxZoom: 11 } satisfies L.FitBoundsOptions;
    if (bezRuchu.matches) {
      map.fitBounds(zasieg, { ...ramka, animate: false });
      rysuj();
    } else {
      map.once("moveend", rysuj);
      map.flyToBounds(zasieg, { ...ramka, duration: 1 });
      wLocie = true;
    }
  }

  /**
   * Chooses a town, or none: its dot grows, a popup opens at it and, on the
   * distribution map, the road to it is drawn.
   */
  function wybierz(nowa: Kropka | undefined, lec = false): void {
    const stara = wybrana;
    if (!stara && !nowa) return;
    wybrana = nowa;
    if (stara) {
      stara.kropka.getElement()?.classList.remove("is-wybrana");
      stara.kropka.setRadius(promien(stara.m));
    }
    // A searched place's dot goes with the choice, even when the same place
    // is searched again: it gets a new one.
    if (stara?.wlasna !== undefined) {
      if (stara === wskazana) wskaz(undefined);
      stara.kropka.remove();
    }
    // Forgotten before it is closed, so that closing it here does not count
    // as the reader closing it (`popupclose`, below).
    const stary = dymek;
    dymek = undefined;
    if (stary) map.closePopup(stary);
    usunTrase();
    if (nowa) {
      nowa.kropka.setRadius(PROMIEN_DUZY).bringToFront();
      nowa.kropka.getElement()?.classList.add("is-wybrana");
      if (nowa === wskazana) map.closeTooltip(tabliczka);
      // A click leaves the view alone, but for the popup moving into the
      // frame; a town picked outside the map gets the view set for it.
      // A searched place's long name ("Nowa Wieś (gm. Chorzele)") breaks
      // its line on a phone's narrow map instead of making the popup wider
      // than the map. The towns' names are short enough.
      const waski = nowa.wlasna !== undefined ? { maxWidth: Math.min(300, map.getSize().x - 60) } : {};
      dymek = L.popup({ offset: [0, -2], autoPan: !lec, ...waski }).setLatLng(nowa.kropka.getLatLng()).setContent(trescDymka(nowa));
      map.openPopup(dymek);
      if (zTrasami) void pokazTrase(nowa, lec);
    }
    if (zTrasami && stara !== nowa) {
      el.dispatchEvent(new CustomEvent("mapa:wybrano", { detail: { klucz: nowa?.m.klucz ?? null }, bubbles: true }));
    }
  }
  // Closed by its cross, by Escape or by the warehouse's popup opening: the
  // town is no longer chosen.
  map.on("popupclose", (e) => {
    if (e.popup !== dymek) return;
    dymek = undefined;
    wybierz(undefined);
  });

  /** True over a popup, a button or the warehouse's pin, which keep the pointer for themselves. */
  const zajety = (e: L.LeafletMouseEvent) =>
    e.originalEvent.target instanceof Element && e.originalEvent.target.closest(".leaflet-popup, .leaflet-control, .leaflet-marker-icon") !== null;
  const dotyk = (e: L.LeafletMouseEvent) => palec.matches || (e.originalEvent as PointerEvent).pointerType === "touch";
  map.on("mousemove", (e) => wskaz(zajety(e) || e.originalEvent.buttons > 0 ? undefined : najblizsza(e.containerPoint, dotyk(e))));
  el.addEventListener("mouseleave", () => wskaz(undefined));
  map.on("click", (e) => {
    if (zajety(e)) return;
    // A finger never leaves the map as a mouse does: the tapped dot would
    // stay lit after its popup is closed.
    if (dotyk(e)) wskaz(undefined);
    const k = najblizsza(e.containerPoint, dotyk(e));
    if (k && k === wybrana) return;
    // A click beside every town closes whatever popup is open, the
    // warehouse's too.
    if (!k) map.closePopup();
    // A dot clicked while the map is still flying to another town: the map
    // goes to this one's road instead of stopping halfway with the popup
    // outside the frame.
    wybierz(k, wLocie);
  });

  if (zTrasami) {
    // The page steers the map through its element: the search field and the
    // town list on /mapa-dystrybucji/ choose a town.
    el.addEventListener("mapa:wybierz", (e) => {
      const { klucz, punkt }: Partial<WyborMapy> = (e as CustomEvent).detail ?? {};
      // A place without a dot gets one for as long as it is chosen, drawn
      // like a chosen town's. It does not widen the opening view (`bounds`).
      if (punkt) {
        const { wlasna, gmina, lat, lng } = punkt;
        const kropka = L.circleMarker([lat, lng], { radius: PROMIEN_DUZY, interactive: false, className: "mapa-miejsce" }).addTo(map);
        return wybierz({ m: { klucz: punkt.klucz, nazwa: punkt.nazwa, lat, lng, href: null, wyroznione: false }, kropka, wlasna, gmina }, true);
      }
      // No such town, or none asked for: nothing is chosen, the view stays.
      wybierz(
        kropki.find((kropka) => kropka.m.klucz === klucz),
        true,
      );
    });
    // Back to the whole area, from a button in the map's corner: on a phone
    // one finger cannot move the map, so this is the way out of a close-up.
    // Shown only when there is somewhere to go back from.
    const calosc = Object.assign(document.createElement("button"), { type: "button", className: "mapa-calosc", textContent: "Pokaż cały obszar", hidden: true });
    L.DomEvent.disableClickPropagation(calosc);
    calosc.addEventListener("click", () => {
      wybierz(undefined);
      calyWidok(!bezRuchu.matches);
      wLocie = !bezRuchu.matches;
    });
    const Przycisk = L.Control.extend({ onAdd: () => calosc });
    new Przycisk({ position: "bottomleft" }).addTo(map);
    const pokazCalosc = () => {
      const zbedny = wybrana === undefined && wCalymWidoku();
      // The button goes from under the keyboard's focus: the focus moves to
      // the map rather than being lost.
      if (zbedny && document.activeElement === calosc) el.focus({ preventScroll: true });
      calosc.hidden = zbedny;
    };
    map.on("moveend", pokazCalosc);
    el.addEventListener("mapa:wybrano", pokazCalosc);
    // A map still at its opening view keeps it when its box changes size (a
    // phone turned on its side, a window resized).
    map.on("resize", () => {
      if (calosc.hidden) calyWidok(false);
    });
    el.dataset.gotowa = "";
    el.dispatchEvent(new CustomEvent("mapa:gotowa", { bubbles: true }));
  }

  if (!L.Browser.mobile) return;
  // One finger scrolls the page past the map; a reader who meant to move
  // the map is told how, for a moment, as on other maps.
  const wskazowka = Object.assign(document.createElement("p"), {
    className: "mapa-wskazowka",
    textContent: "Mapę przesuniesz dwoma palcami",
  });
  wskazowka.setAttribute("aria-hidden", "true");
  el.append(wskazowka);
  let zgas: number | undefined;
  el.addEventListener(
    "touchmove",
    (e) => {
      const jeden = e.touches.length === 1;
      wskazowka.classList.toggle("is-widoczna", jeden);
      window.clearTimeout(zgas);
      if (jeden) zgas = window.setTimeout(() => wskazowka.classList.remove("is-widoczna"), 1200);
    },
    { passive: true },
  );
}
