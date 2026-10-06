/**
 * Draws a map for Mapa.astro with Leaflet and OpenStreetMap tiles. Loaded on
 * demand, with Leaflet's own stylesheet, when a map comes near the screen:
 * a page whose map is never seen never pays for Leaflet.
 */
import L from "leaflet";
import leafletCss from "leaflet/dist/leaflet.css?url";

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
    nazwa: string;
    lat: number;
    lng: number;
    href: string | null;
    wyroznione: boolean;
  }[];
}

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
function link(href: string, text: string): HTMLAnchorElement {
  const a = document.createElement("a");
  a.href = href;
  a.textContent = text;
  return a;
}

/** Draws the map into `el`, from its `data-mapa` and `data-zoom`. */
export async function narysujMape(el: HTMLElement): Promise<void> {
  await wczytajArkusz();
  const dane: DaneMapy = JSON.parse(el.dataset.mapa ?? "{}");
  const { magazyn } = dane;

  // A page scrolling past the map must not get caught by it: no
  // scroll-wheel zoom, and on a touch screen one finger scrolls the page
  // instead of dragging the map. The +/- buttons zoom, and two fingers
  // still move and zoom the map.
  const map = L.map(el, { scrollWheelZoom: false, dragging: !L.Browser.mobile, zoomControl: false });
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

  const bounds = L.latLngBounds([[magazyn.lat, magazyn.lng]]);

  for (const m of dane.miejsca) {
    const lines: (string | Node)[] = [strong(m.nazwa)];
    if (m.href) lines.push(link(m.href, "Dostawa i ceny"));

    L.circleMarker([m.lat, m.lng], {
      radius: m.wyroznione ? 9 : 5,
      className: [
        "mapa-miejsce",
        m.wyroznione ? "mapa-miejsce-wyroznione" : "",
      ].join(" "),
    })
      .addTo(map)
      .bindPopup(popup(...lines));
    bounds.extend([m.lat, m.lng]);
  }

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
  L.marker([magazyn.lat, magazyn.lng], { icon, title: `Magazyn ${magazyn.nazwa}`, alt: `Magazyn ${magazyn.nazwa}` })
    .addTo(map)
    .bindPopup(popup(strong(`Magazyn ${magazyn.nazwa}`), magazyn.adres, link(magazyn.telHref, `tel.\u00a0${magazyn.tel.replace(/ /g, "\u00a0")}`)));

  if (dane.miejsca.length === 0) {
    map.setView([magazyn.lat, magazyn.lng], Number(el.dataset.zoom));
  } else {
    map.fitBounds(bounds, { padding: [24, 24] });
  }
  // Leaflet draws the dots, once the map has its view, in one SVG, which a
  // screen reader would announce as an image without a name; the list under
  // the map names the same towns.
  map.getPanes().overlayPane.querySelector("svg")?.setAttribute("aria-hidden", "true");

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
